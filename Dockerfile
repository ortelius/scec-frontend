FROM public.ecr.aws/amazonlinux/amazonlinux:2023.6.20241010.0@sha256:75763d26a28070a9ac04d0250585119566734b1f5182474afd4cb062a26ef07f
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

EXPOSE 8080

WORKDIR /usr/src/app

COPY package*.json .

# hadolint ignore=DL3041,DL3016
RUN curl -fsSL https://rpm.nodesource.com/setup_21.x | bash -; \
    dnf install nodejs -y; \
    npm install -g npm; \
    npm install --ignore-scripts; \
    dnf upgrade -y; \
    dnf clean all

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
