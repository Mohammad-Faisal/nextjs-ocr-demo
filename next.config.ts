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
      {
        source: '/customer/uploadDocuments',
        destination: 'http://localhost:3000/customer/uploadDocuments',
      },
    ];
  },
};

export default nextConfig;
