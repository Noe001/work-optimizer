/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_API_BASE_URL: string;
    readonly DEV: boolean;
    readonly [key: string]: string | boolean | undefined;
  };
}
