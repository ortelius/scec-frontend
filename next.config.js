/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname
    return config
  },
  outputFileTracingRoot: __dirname
}

module.exports = nextConfig
