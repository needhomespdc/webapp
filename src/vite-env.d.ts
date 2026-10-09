/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

// The app's own environment variables (from .env / Vercel). Declaring them gives
// import.meta.env.VITE_* real types and autocomplete; a typo is now a compile error.
interface ImportMetaEnv {
  /** REST API base, e.g. https://api.needhomes.ng/api (falls back to that if unset) */
  readonly VITE_API_BASE_URL?: string;
  /** Socket.IO server for real-time notifications */
  readonly VITE_SOCKET_URL?: string;
  /** Paystack public key (safe for the browser; not currently read by the code) */
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
