FROM public.ecr.aws/amazonlinux/amazonlinux:2023.9.20251027.0@sha256:5f408731c7de2f2c313dbc2dc387b00791aa87c36dc2711caaa053d2991f178a
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
