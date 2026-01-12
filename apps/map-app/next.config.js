const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@map-app/models': path.resolve(__dirname, '../../libs/models/src'),
      '@map-app/services': path.resolve(__dirname, '../../libs/services/src'),
    };
    return config;
  },
};

module.exports = nextConfig;
