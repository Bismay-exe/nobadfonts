/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ReactNode, ComponentType } from 'react';

  export const frontmatter: {
    title?: string;
    description?: string;
    badge?: string;
    order?: number;
    [key: string]: unknown;
  };

  export default function MDXContent(props: {
    components?: Record<string, ComponentType<any>>;
  }): ReactNode;
}
