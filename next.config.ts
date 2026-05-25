import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  }
};

export default withNextIntl(nextConfig);
