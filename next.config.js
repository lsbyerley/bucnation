/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';
const prefixUrl = process.env.NEXT_PUBLIC_PREFIX_URL;

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // trailingSlash: true,
  assetPrefix: isProd ? prefixUrl : '',
  images: {
    loader: 'akamai',
    path: '/',
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
