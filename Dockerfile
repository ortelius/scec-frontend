FROM node:21-alpine@sha256:9696b265f0a9ad213c690f2aa777d3e001ff91847f7370e15d66fbfe23ce51b2
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
