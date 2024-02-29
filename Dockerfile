FROM node:21-alpine@sha256:d3271e4bd89eec4d97087060fd4db0c238d9d22fcfad090a73fa9b5128699888
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
