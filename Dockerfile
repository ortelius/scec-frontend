FROM public.ecr.aws/amazonlinux/amazonlinux:2023.9.20251105.0@sha256:b0f8d1179ea5555f33163cbd33ad91ac5c553d334da210741171fa5e40cbefa9
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
