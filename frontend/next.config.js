/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL || "http://backend:8080"}/:path*`,
      },
      {
        source: "/alfred-api/:path*",
        destination: `${process.env.ALFRED_API_INTERNAL_URL || "http://host.docker.internal:3003"}/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
