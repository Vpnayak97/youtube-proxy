FROM node:18-slim

RUN apt-get update && apt-get install -y python3 pip && rm -rf /var/lib/apt/lists/*
RUN pip install yt-dlp


WORKDIR /app

RUN pip install yt-dlp

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "server.js"]
