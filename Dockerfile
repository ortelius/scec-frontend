FROM public.ecr.aws/amazonlinux/amazonlinux:2023.5.20241001.1@sha256:d98c1c8b83f153add6073e6579d153398928f2d5117d982f3cb0d03e8cb09f53
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
