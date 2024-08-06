FROM public.ecr.aws/amazonlinux/amazonlinux:2023.5.20240805.0@sha256:03c807fdc5d40ab06b21c2e6d158c63c37d5149a127b7fdfa9e3c1150352ff20
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
