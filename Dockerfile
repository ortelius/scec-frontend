FROM public.ecr.aws/amazonlinux/amazonlinux:2023.6.20250218.2@sha256:d66610d8193eb6169ad950ad5c253ff2be0ec89cff37b78c4e977a06e3889b1a
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

EXPOSE 8080

WORKDIR /usr/src/app

COPY package*.json .

# hadolint ignore=DL3041,DL3016
RUN curl -fsSL https://rpm.nodesource.com/setup_23.x | bash -; \
    dnf install nodejs -y; \
    npm install -g npm; \
    npm install --ignore-scripts; \
    dnf upgrade -y; \
    dnf clean all

COPY . .

RUN npm run prepare &&\
  npm run build

CMD ["npm", "run", "preview"]
