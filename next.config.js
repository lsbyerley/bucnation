/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'ipfs.infura.io',
      'place-hold.it',
      'statics-polygon-lens-staging.s3.eu-west-1.amazonaws.com',
    ],
  },
  experimental: {
    newNextLinkBehavior: true,
    images: {
      allowFutureImage: true,
    },
  },
};

module.exports = nextConfig;
