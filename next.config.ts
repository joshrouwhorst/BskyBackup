import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    deviceSizes: [80, 200, 400, 800, 1200],
    imageSizes: [16, 32, 64, 128, 256, 512],
  },
}

export default nextConfig
