FROM node:11.14.0-alpine AS client

ENV NODE_ENV=production

WORKDIR /client

COPY ./client .

RUN npm install --silent && npm run build

FROM node:11.14.0-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY ./package.json ./package.json

RUN npm install --silent

COPY --from=client /client/build ./client/build

COPY ./server ./server

COPY ./index.js .

CMD ["npm", "run", "start"]