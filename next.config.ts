import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apps.usos.pw.edu.pl',
        port: '',
        pathname: '/',
      },
    ],
  },
};

export default nextConfig;
