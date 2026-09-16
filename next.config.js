/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/ar-kitsune',
        destination: '/ar-kitsune/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
