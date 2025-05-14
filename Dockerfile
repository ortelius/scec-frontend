FROM public.ecr.aws/amazonlinux/amazonlinux:2023.7.20250512.0@sha256:ff1fad724e2ef77b8851124cbc35204d1defe63128f077021a2b3e459fcd866f
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
