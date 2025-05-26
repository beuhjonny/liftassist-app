/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string; // Or just BASE_URL if Vite defines it directly
  // Add other VITE_ variables you use here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}