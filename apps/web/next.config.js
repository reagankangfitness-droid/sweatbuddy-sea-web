/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "**",
      },
    ],
  },
  transpilePackages: ['@sweatbuddy/ui', '@sweatbuddy/types'],
}

module.exports = nextConfig
