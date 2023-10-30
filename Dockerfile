FROM node:21-alpine@sha256:df76a9449df49785f89d517764012e3396b063ba3e746e8d88f36e9f332b1864

WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
