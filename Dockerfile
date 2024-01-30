FROM node:21-alpine@sha256:a8beafd69068c05d09183e75b9aa679b520ba68f94b19c90d0da9f307f9f6565
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
