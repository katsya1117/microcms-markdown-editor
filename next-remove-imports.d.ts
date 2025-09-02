declare module "next-remove-imports" {
  import type { NextConfig } from "next";

  type RemoveImports = (options?: Record<string, unknown>) => (config: NextConfig) => NextConfig;

  const removeImports: RemoveImports;
  export default removeImports;
}