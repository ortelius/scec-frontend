FROM node:21-alpine@sha256:34556ba78497768394c896cca78c490f620e624ddacd4ebe47380c52e3e5cf79
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
