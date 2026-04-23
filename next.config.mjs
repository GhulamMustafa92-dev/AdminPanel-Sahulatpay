/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source:      "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "https://web-production-6c2cd.up.railway.app"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
