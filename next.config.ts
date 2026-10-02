import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/register',
        destination: '/registration',
      },
      {
        source: '/register/individual',
        destination: '/registration/individual',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/register/college',
        destination: '/registration',
        permanent: false,
      },
      {
        source: '/registration/college',
        destination: '/registration',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
