const express = require('express'); 
const puppeteer = require('puppeteer');
const Jimp = require('jimp')
const app = express(); 
const port = 3001; 


app.get('/example', (req, res) => {
    const myString = req.query.myString;
    res.send(`Received string: ${myString}`);
  });

app.get('/generateImage', async (req, res) => {
    try {

      const username = req.query.username;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      await page.setViewport({ width: 800, height: 600 }); 
      await page.goto(`http://localhost:3000/username/${username}`); 
      await page.waitForSelector('.cal-div'); 
  
      const calDivRect = await page.evaluate(() => {
        const calDiv = document.querySelector('.cal-div');
        if (!calDiv) return null;
        const { x, y, width, height } = calDiv.getBoundingClientRect();
        return { x, y, width, height };
      });
  
      if (!calDivRect) {
        throw new Error('Calendar div not found');
      }
  
      const imageBuffer = await page.screenshot({
        encoding: 'binary',
        clip: calDivRect
      });
  
      await browser.close();
      const padding = 10; 
      const image = await Jimp.read(imageBuffer);
      const centerX = (image.getWidth()  + 8 * padding) / 2;
      const centerY = (image.getHeight()  + 2 * padding) / 2;
      const backgroundColor = 'white'; 
  
      const newImage = new Jimp(image.getWidth() + 2 * padding, image.getHeight() + 2 * padding, backgroundColor);
      newImage.composite(image, centerX - image.getWidth() / 2, centerY - image.getHeight() / 2); 
  
      const newImageBuffer = await newImage.getBufferAsync(Jimp.MIME_PNG);
  
      res.set('Content-Type', 'image/png');
      res.send(newImageBuffer);
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).send('Error generating image');
    }
  });
  
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });