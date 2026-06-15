FROM node:22-alpine

# Install yt-dlp (which automatically brings in python3 as well)
RUN apk add --no-cache yt-dlp

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]