import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from the project root and parent directories
      allow: [
        // Project root
        path.resolve(__dirname, '.'),
        // Parent directory (for node_modules that might be outside project)
        path.resolve(__dirname, '..'),
        // Allow access to node_modules in project
        path.resolve(__dirname, 'node_modules'),
        // Allow access to user's home directory node_modules (Windows)
        ...(process.env.USERPROFILE ? [path.resolve(process.env.USERPROFILE, 'node_modules')] : []),
        // Allow access to user's home directory node_modules (Unix/Mac)
        ...(process.env.HOME ? [path.resolve(process.env.HOME, 'node_modules')] : []),
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

