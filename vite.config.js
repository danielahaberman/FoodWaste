
// https://vite.dev/config/
export default {
  base: '/',
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false,
    proxy: {
      // Proxy API requests to the backend server
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxying
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 Proxying ${req.method} ${req.url} -> http://localhost:5001${proxyReq.path}`);
            console.log(`   Origin: ${req.headers.origin || 'no origin'}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`✅ Proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
          });
        },
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/purchases': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/food-purchases': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/food-items': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/add-food-item': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/purchase': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/quantity-types': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/food-categories': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/survey-questions': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/survey-response': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/consumption-log': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/consumption-summary': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/consumption-trends': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/consumption-by-category': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/consumption-logs': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        bypass: (req) => {
          // Don't proxy the exact /admin path (frontend route handled by React Router)
          // Only proxy /admin/* API endpoints
          const url = req.url || '';
          if (url === '/admin' || url === '/admin/') {
            // Return index.html to let React Router handle the route
            return '/index.html';
          }
          // Continue proxying for /admin/* API paths
          return null;
        },
      },
      '/health': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
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