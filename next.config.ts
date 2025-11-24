import type { NextConfig } from "next"

const SUPABASE_HOST = "vmhlmcwsylkpxzkjmjix.supabase.co"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/public/doc-images/**",
      },
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/public/project-images/**",
      },
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/public/project-covers/**",
      },
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/public/cert-images/**",
      },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      `connect-src 'self' https://${SUPABASE_HOST} ws: wss:`,
      `img-src 'self' data: https://${SUPABASE_HOST}`,
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "frame-ancestors 'self'",
      "font-src 'self' data:",
    ].join("; ")

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ]
  },
}

export default nextConfig
