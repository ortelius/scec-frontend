FROM node:20-alpine@sha256:37750e51d61bef92165b2e29a77da4277ba0777258446b7a9c99511f119db096

WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
