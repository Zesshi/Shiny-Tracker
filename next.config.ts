/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep production verification from overwriting a running local preview.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    unoptimized : true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/sprites/master/sprites/pokemon/**',
      },
    ],
  },
}

module.exports = nextConfig
