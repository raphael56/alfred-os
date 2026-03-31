/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          // Proxy vers backend Rust — exclut /api/auth/* (géré par NextAuth)
          source: "/api/:path((?!auth(?:/|$)).*)",
          destination: `${process.env.API_INTERNAL_URL || "http://backend:8080"}/:path`,
        },
        {
          source: "/alfred-api/:path*",
          destination: `${process.env.ALFRED_API_INTERNAL_URL || "http://host.docker.internal:3003"}/:path*`,
        },
      ],
      fallback: [],
    };
  },
};
module.exports = nextConfig;
