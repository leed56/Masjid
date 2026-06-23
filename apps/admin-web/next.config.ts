import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@masjidhub/config', '@masjidhub/types', '@masjidhub/utils'],
}

export default nextConfig
