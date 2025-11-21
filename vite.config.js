
// https://vite.dev/config/
export default {
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  define: {
    // Ensure environment variables are available
    'process.env': {}
  }
};