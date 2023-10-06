FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare
RUN npm run build

CMD ["npm", "run", "preview"]
