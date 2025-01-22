import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/check-document',
        destination: 'http://localhost:4000/api/check-document',
      },
    ];
  },
};

export default nextConfig;
