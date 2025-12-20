import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './',
    define: {
      // Provide environment variables to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || process.env.RESEND_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': '/src', // Use '@' as alias for '/src'
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});
