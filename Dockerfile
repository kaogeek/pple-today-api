FROM node:14

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 9000

ENV NODE_ENV=production
ENV TZ=Asia/Bangkok

CMD [ "node", "./dist/app.js" ]

