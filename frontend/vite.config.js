import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    // The storefront, admin dashboard and all their deps ship from one SPA —
    // react-dom + router + react-query + framer-motion alone blow past the
    // default 500 KB warning. Split each big vendor into its own long-lived
    // chunk so browsers can cache them independently across deploys, and
    // raise the warning ceiling to something sane for this app's size.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          motion: ['framer-motion'],
          icons: ['react-icons', 'lucide-react'],
          forms: ['react-hook-form', 'zod'],
          utils: ['axios', 'zustand', 'clsx', 'dayjs', 'react-hot-toast'],
        },
      },
    },
  },
})
