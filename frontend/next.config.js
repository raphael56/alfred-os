/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL || "http://backend:8080"}/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
