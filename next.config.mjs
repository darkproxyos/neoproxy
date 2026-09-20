/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/npos/lab',
        destination: '/lab',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/realidad-aumentada',
        destination: '/realidad-aumentada/index.html',
      },
    ];
  },
  // Configuración para Next.js 16 / Turbopack
  experimental: {
    // Si Turbopack tiene problemas con el root en Next 16
    turbo: {
      resolveAlias: {
        // Alias útiles
      },
    },
  },
  // Desactivar linting durante el build para acelerar despliegue si es necesario
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
