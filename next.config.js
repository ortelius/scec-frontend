/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname
    return config
  },
}

module.exports = nextConfig
