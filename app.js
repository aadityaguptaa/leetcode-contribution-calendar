const express = require("express");
const cors = require("cors"); // ✅ Import CORS
const puppeteer = require("puppeteer");
const Jimp = require("jimp");
const app = express();
const dayjs = require("dayjs");
const { getLeetcodeContributions } = require('./getLeetcodeContributions');
const svg2img = require("svg2img");
require("dotenv").config();
const LeetcodeCalendar = require('./leetcodeCalendar');  
const constants = require('./constants.js');  
const port = constants.PORT; 

// ✅ Enable CORS for all origins
app.use(cors());

// Optional: Restrict CORS to specific origin
// app.use(cors({ origin: "http://localhost:3000" }));


app.get("/svg", async (req, res) => {
  try {
    const { username } = req.query;

    const contributions = await getLeetcodeContributions(username);
    if (!contributions) {
      return res.status(500).send("Failed to fetch Leetcode contributions.");
    }

    const until = dayjs().format(constants.DATE_FORMAT);
    const calendar = new LeetcodeCalendar();
    const svgString = calendar.renderSvgString(constants.COLUMNS, contributions, until);

    res.setHeader("Content-Type", constants.SVG_CONTENT_TYPE);
    res.send(svgString);
  } catch (error) {
    console.error("Error generating SVG:", error);
    res.status(500).send("Internal Server Error");
  }
});


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
      executablePath: process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 800, height: 600 });
    await page.goto(`https://leetcode-contribution-calendar-react.vercel.app/username/${username}`);
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
