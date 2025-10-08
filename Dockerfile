FROM public.ecr.aws/amazonlinux/amazonlinux:2023.9.20250929.0@sha256:1517e612da23256b909cacc51dfc66a1918ba8c7bd8cc2b232e8929b8f3d8dd4
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

EXPOSE 3000

RUN npm run build

CMD ["npm", "run", "start"]
