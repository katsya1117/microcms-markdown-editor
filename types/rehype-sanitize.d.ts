// types/rehype-sanitize.d.ts
declare module "rehype-sanitize" {
  import type { Plugin } from "unified";

  export interface Schema {
    tagNames?: string[];
    attributes?: Record<string, string[]>;
    protocols?: Record<string, string[]>;
  }

  export const defaultSchema: Schema;

  const rehypeSanitize: Plugin<[Schema?]>;
  export default rehypeSanitize;
}