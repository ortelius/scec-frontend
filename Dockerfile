FROM node:21-alpine@sha256:ad255c65652e8e99ce0b9d9fc52eee3eae85f445b192f6f9e49a1305c77b2ba6
EXPOSE 8080


WORKDIR /usr/src/app

COPY package*.json .
RUN npm install --ignore-scripts

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
