FROM public.ecr.aws/amazonlinux/amazonlinux:2023.9.20251014.0@sha256:78804160fd6e168e29aab05b9482b566addb6879c37c75053172cb6e911232ea
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

EXPOSE 8080

WORKDIR /usr/src/app

COPY package*.json .

# hadolint ignore=DL3041,DL3016
RUN curl -fsSL https://rpm.nodesource.com/setup_23.x | bash -; \
    dnf install nodejs -y; \
    npm install -g npm; \
    npm install; \
    dnf upgrade -y; \
    dnf clean all

COPY . .

EXPOSE 3000

RUN npm run build

CMD ["npm", "run", "start"]
