/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SALEOR_API_URL?: string;
  readonly VITE_SALEOR_CHANNEL?: string;
  readonly VITE_SALEOR_DOCS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
