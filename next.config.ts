import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vmhlmcwsylkpxzkjmjix.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**', // อนุญาตทุก path ใน public bucket
      },
      // ... (ถ้ามีโดเมนอื่นๆ ก็เพิ่มต่อตรงนี้) ...
    ],
  },
};

export default nextConfig;
