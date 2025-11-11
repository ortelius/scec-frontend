FROM public.ecr.aws/amazonlinux/amazonlinux:2023.9.20251110.1@sha256:c929105619fbc4cb4cb2d0667a02b549a3408be98e89d9c61437ca702d04d829
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
