/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/npos/lab',
        destination: '/lab',
        permanent: false,
      },
      {
        source: '/npos/fabrication/gallery',
        destination: '/fabrication/gallery',
        permanent: false,
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
