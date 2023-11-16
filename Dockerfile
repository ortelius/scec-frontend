FROM node:21-alpine@sha256:f07e0cefd7566fc0b5f652625b809290b3095a7cede9c63681a6883729e31e3d

WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
