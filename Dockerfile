FROM python:3.11-slim

WORKDIR /app

RUN pip install yt-dlp

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "server.js"]
