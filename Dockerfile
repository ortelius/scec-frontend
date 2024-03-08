FROM node:21-alpine@sha256:7bfef1d72befbb72b0894a3e4503edbdc0441058b4d091325143338cbf54cff8
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
