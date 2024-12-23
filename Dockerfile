FROM node:14

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 9000

ENV NODE_ENV production

CMD [ "node", "./dist/app.js" ]

