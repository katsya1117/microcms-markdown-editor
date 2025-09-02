import type { NextConfig } from "next";
import removeImports from "next-remove-imports";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

export default removeImports()({
  ...nextConfig,
});