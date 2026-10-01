// Vite-la configuration create panna defineConfig import pannrom
import { defineConfig } from 'vite'

// React support add panna React plugin import pannrom
import react from '@vitejs/plugin-react'

// Tailwind CSS support add panna Tailwind plugin import pannrom
import tailwindcss from '@tailwindcss/vite'

// Vite configuration export pannrom
export default defineConfig({

  // Vite use panna plugins list
  plugins: [

    // React JSX, Fast Refresh etc. enable pannum
    react(),

    // Tailwind CSS classes work aaga enable pannum
    tailwindcss(),

  ],
})