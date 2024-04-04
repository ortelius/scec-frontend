FROM node:21-alpine@sha256:87524df5d70923c6733401987fb049f2fb0e10ff460ff19a3bf5f50fd80f63b0
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
