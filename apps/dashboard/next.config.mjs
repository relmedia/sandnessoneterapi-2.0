/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/email"],
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    serverActions: {
      // Image uploads go through a Server Action; default is 1 MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
