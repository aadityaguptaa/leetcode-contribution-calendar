const express = require("express");
const puppeteer = require("puppeteer");
const Jimp = require("jimp");
const app = express();
const port = process.env.PORT || 3001;
const dayjs = require("dayjs");
const { getGitHubContributions } = require('./getGitHubContributions');


const svg2img = require("svg2img");

require("dotenv").config();

app.get("/svg", async (req, res) => {
  try {

    const columns = 53;
    const values =await getGitHubContributions(req.query.username);
    const until = dayjs().format("YYYY-MM-DD"); 
    if (!values) {
      res.status(500).send("Failed to fetch GitHub contributions.");
      return;
    }

    const calendar = new GitHubCalendar({
      weekNames: ["", "M", "", "W", "", "F", ""],
      monthNames: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      panelColors: ["#EEEEEE", "#F78A23", "#F87D09", "#AC5808", "#7B3F06"],
      dateFormat: "YYYY-MM-DD",
    });

    const svgString = calendar.renderSvgString(columns, values, until);

    // Convert SVG to PNG using svg2img
    svg2img(svgString, function (error, buffer) {
      if (error) {
        console.error("Error converting SVG to PNG:", error);
        res.status(500).send("Internal Server Error");
        return;
      }

      // Set the appropriate headers and send the image as a response
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svgString);
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).send("Internal Server Error");
  }
});



async function generateSvgBuffer(svgString) {
  const image = await Jimp.read(Buffer.from(svgString));
  return image.getBufferAsync(Jimp.MIME_SVG);
}

class GitHubCalendar {
  constructor(props) {
    this.weekNames = props.weekNames || ["", "M", "", "W", "", "F", ""];
    this.monthNames = props.monthNames || [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    this.panelColors = props.panelColors || ["#EEEEEE", "#F78A23", "#F87D09", "#AC5808", "#7B3F06"];
    this.dateFormat = props.dateFormat || "YYYY-MM-DD";
    this.monthLabelHeight = 24;
    this.weekLabelWidth = 21;
    this.panelSize = 13;
    this.panelMargin = 3;
  }

  getPanelPosition(row, col) {
    const bounds = this.panelSize + this.panelMargin;
    return {
      x: this.weekLabelWidth + bounds * row,
      y: this.monthLabelHeight + bounds * col,
    };
  }

  makeCalendarData(history, lastDay, columns) {
    const d = dayjs(lastDay, { format: this.dateFormat });
    const lastWeekend = d.endOf("week");
    const endDate = d.endOf("day");

    var result = [];
    for (var i = 0; i < columns; i++) {
      result[i] = [];
      for (var j = 0; j < 7; j++) {
        var date = lastWeekend.subtract((columns - i - 1) * 7 + (6 - j), "day");
        if (date <= endDate) {
          result[i][j] = {
            value: history[date.format(this.dateFormat)] || 0,
            month: date.month(),
          };
        } else {
          result[i][j] = null;
        }
      }
    }

    return result;
  }

  renderSvgString(columns, values, until) {
    var contributions = this.makeCalendarData(values, until, columns);

    const paddingLeft = 20;
  const paddingRight = 20;

  // Calculate total width considering padding
  const totalWidth = "100%";
  const paddedWidth = `calc(${totalWidth} - ${paddingLeft + paddingRight}px)`;
    var innerSvgString = "";
    innerSvgString += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${paddedWidth} 110">`;


    for (var i = 0; i < columns; i++) {
      for (var j = 0; j < 7; j++) {
        var contribution = contributions[i][j];
        if (contribution === null) continue;
        const pos = this.getPanelPosition(i, j);
        const numOfColors = this.panelColors.length;
        const color =
          contribution.value >= numOfColors
            ? this.panelColors[numOfColors - 1]
            : this.panelColors[contribution.value];
        const rectSvgString = `<rect
          key="${"panel_key_" + i + "_" + j}" 
          x="${pos.x}"
          y="${pos.y}"
          width="${this.panelSize}"
          height="${this.panelSize}"
          fill="${color}"
          rx="6"
          ry="6"
        />`;
        innerSvgString += rectSvgString;
      }
    }

    for (var i = 0; i < this.weekNames.length; i++) {
      const textBasePos = this.getPanelPosition(0, i);
      const textSvgString = `<text
        key="${"week_key_" + i}"
        style="
          fontSize: 9;
          alignmentBaseline: central;
          fill: white;
        "
        x="${textBasePos.x - this.panelSize / 2 -10 }"
        y="${textBasePos.y + this.panelSize / 2 +5}"
        textAnchor="middle"
      >
        ${this.weekNames[i]}
      </text>`;
      innerSvgString += textSvgString;
    }


    

    var prevMonth = -1;
    for (var i = 0; i < columns; i++) {
      const c = contributions[i][0];
      if (c === null) continue;
      if (columns > 1 && i == 0 && c.month != contributions[i + 1][0]?.month) {
        continue;
      }
      if (c.month != prevMonth) {
        var textBasePos = this.getPanelPosition(i, 0);
        const textSvgString = `<text
          key="${"month_key_" + i}"
          style="
            fontSize: 10;
            alignmentBaseline: central;
            fill: #AAA;
          "
          x="${textBasePos.x + this.panelSize / 2}"
          y="${textBasePos.y - this.panelSize / 2 - 2}"
          textAnchor="middle"
        >
          ${this.monthNames[c.month]}
        </text>`;
        innerSvgString += textSvgString;
      }
      prevMonth = c.month;
    }

    innerSvgString += "</svg>";

    return innerSvgString;
  }
}

app.get("/generateImage", async (req, res) => {
  try {
    const username = req.query.username;
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 800, height: 600 });
    await page.goto(
      `https://leetcode-contribution-calendar-react.vercel.app/username/${username}`
    );
    await page.waitForSelector(".cal-div");

    const calDivRect = await page.evaluate(() => {
      const calDiv = document.querySelector(".cal-div");
      if (!calDiv) return null;
      const { x, y, width, height } = calDiv.getBoundingClientRect();
      return { x, y, width, height };
    });

    if (!calDivRect) {
      throw new Error("Calendar div not found");
    }

    const imageBuffer = await page.screenshot({
      encoding: "binary",
      clip: calDivRect,
    });

    await browser.close();
    const padding = 10;
    const image = await Jimp.read(imageBuffer);
    const centerX = (image.getWidth() + 8 * padding) / 2;
    const centerY = (image.getHeight() + 2 * padding) / 2;
    const backgroundColor = "white";

    const newImage = new Jimp(
      image.getWidth() + 2 * padding,
      image.getHeight() + 2 * padding,
      backgroundColor
    );
    newImage.composite(
      image,
      centerX - image.getWidth() / 2,
      centerY - image.getHeight() / 2
    );

    const newImageBuffer = await newImage.getBufferAsync(Jimp.MIME_PNG);

    res.set("Content-Type", "image/png");
    res.send(newImageBuffer);
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).send("Error generating image");
  }
});

app.listen(port, () => {
  console.log(`Server is running @${port}`);
});
