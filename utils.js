module.exports={
    getPanelPosition(row, col, panelSize, panelMargin) {
        const bounds = panelSize + panelMargin;
        const x = this.weekLabelWidth + bounds * row;
        const y = this.monthLabelHeight + bounds * col;
    
        return { x, y };
      },
}