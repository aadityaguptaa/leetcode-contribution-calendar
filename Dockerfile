FROM ghcr.io/puppeteer/puppeteer:22.2.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci 
COPY . .
CMD ["node", "app.js"]