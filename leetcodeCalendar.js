const dayjs = require("dayjs");
const constants = require("./constants.js");
const utils = require("./utils.js");


class LeetcodeCalendar {
  constructor(props = {}) {
    const {
      weekNames = constants.WEEK_NAMES,
      monthNames = constants.MONTH_NAMES,
      panelColors = constants.PANEL_COLORS,
      dateFormat = constants.DATE_FORMAT,
    } = props;

    this.weekNames = weekNames;
    this.monthNames = monthNames;
    this.panelColors = panelColors;
    this.dateFormat = dateFormat;

    this.monthLabelHeight = constants.MONTH_LABEL_HEIGHT;
    this.weekLabelWidth = constants.WEEK_LABEL_WIDTH;
    this.panelSize = constants.PANEL_SIZE;
    this.panelMargin = constants.PANEL_MARGIN;
  }

    
  getPanelPosition(row, col) {
    const bounds = this.panelSize + this.panelMargin;
    const x = this.weekLabelWidth + bounds * row;
    const y = this.monthLabelHeight + bounds * col;

    return { x, y };
  }

  makeCalendarData(history, lastDay, columns) {
    const endDate = dayjs(lastDay, { format: this.dateFormat }).endOf("day");
    const result = [];

    for (let i = 0; i < columns; i++) {
      result[i] = Array.from({ length: 7 }, (_, j) => {
        const date = endDate.subtract((columns - i - 1) * 7 + (6 - j), "day");

        return date <= endDate
          ? {
              value: history[date.format(this.dateFormat)] || 0,
              month: date.month(),
            }
          : null;
      });
    }

    return result;
  }

  renderSvgString(columns, values, until) {
    const contributions = this.makeCalendarData(values, until, columns);
    const paddingLeft = 20;
    const paddingRight = 20;
    const totalWidth = "100%";
    const paddedWidth = `calc(${totalWidth} - ${paddingLeft + paddingRight}px)`;

    let innerSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="150">`;

    const innerSvgStrings = [];

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < 7; j++) {
        const contribution = contributions[i][j];
        if (!contribution) continue;

        const { x, y } = this.getPanelPosition(i, j);
        const colorIndex = Math.min(
          contribution.value,
          this.panelColors.length - 1
        );
        const color = this.panelColors[colorIndex];

        innerSvgStrings.push(`<rect
      key="panel_key_${i}_${j}"  
      x="${x}"
      y="${y}"
      width="${this.panelSize}"
      height="${this.panelSize}"
      fill="${color}"
      rx="6"
      ry="6"
    />`);
      }
    }

    innerSvgString += innerSvgStrings.join("");

    for (let i = 0; i < this.weekNames.length; i++) {
      const textBasePos = this.getPanelPosition(0, i);
      const textSvgString = `<text
          key="${"week_key_" + i}"
          style="
            font-size: 0.7em;
            alignment-baseline: central;
            fill: white;
          "
          x="${textBasePos.x - this.panelSize / 2 - 10}"
          y="${textBasePos.y + this.panelSize / 2}"
          textAnchor="middle"
        >
          ${this.weekNames[i]}
        </text>`;
      innerSvgString += textSvgString;
    }

    let prevMonth = -1;
    for (let i = 0; i < columns; i++) {
      const c = contributions[i][0];
      if (c === null) continue;
      if (columns > 1 && i == 0 && c.month != contributions[i + 1][0]?.month) {
        continue;
      }
      if (c.month != prevMonth) {
        const textBasePos = this.getPanelPosition(i, 0);
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
module.exports = LeetcodeCalendar;
