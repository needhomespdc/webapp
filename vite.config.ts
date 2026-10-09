import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Libraries every page needs are split out of the main bundle into their own files, so the
// browser downloads them in parallel and keeps them cached across app updates (a code change
// no longer forces users to re-download React and friends). Heavy libraries used by only a
// few screens (charts, Lottie, country-state-city, the phone input) are deliberately left
// out: they stay in their own lazily loaded chunks.
const VENDOR_CHUNKS: Record<string, string[]> = {
  'vendor-react': ['react', 'react-dom', 'scheduler', 'react-router', 'react-router-dom'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-ui': ['@radix-ui', '@floating-ui', 'class-variance-authority', 'clsx', 'tailwind-merge', 'react-remove-scroll'],
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
  'vendor-icons': ['lucide-react', 'react-icons'],
  'vendor-socket': ['socket.io-client', 'engine.io-client', 'socket.io-parser', 'engine.io-parser'],
}

function vendorChunk(id: string): string | undefined {
  const match = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
  if (!match) return undefined
  const pkg = match[1]
  for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS)) {
    if (packages.some((p) => pkg === p || pkg.startsWith(`${p}/`))) return chunk
  }
  return undefined
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
