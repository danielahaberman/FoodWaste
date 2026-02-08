
// https://vite.dev/config/
export default {
  base: '/',
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false,
    proxy: {
      // Shared proxy options (avoid repeating config everywhere)
      // NOTE: Vite proxy keys are path prefixes. (Regex keys are unreliable across versions.)
      // We use broader prefixes so new endpoints work automatically.
      // Keep /admin as a special case: the exact /admin route is a frontend page,
      // but /admin/* are backend API endpoints.
      ...(() => {
        const target = 'http://localhost:5001';

        const configure = (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 Proxying ${req.method} ${req.url} -> ${target}${proxyReq.path}`);
            console.log(`   Origin: ${req.headers.origin || 'no origin'}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`✅ Proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
          });
        };

        const proxyFor = () => ({
          target,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure,
        });

        // Broad prefixes that cover essentially all backend endpoints.
        const prefixes = [
          '/auth',
          '/api',
          '/admin', // still proxied for /admin/* (bypass below handles exact /admin)
          '/purchase',
          '/purchases',
          '/food',       // covers /food-items, /food-purchases, etc.
          '/popular-food-items',
          '/recent-purchases',
          '/quantity',   // covers /quantity-types
          '/survey',     // covers /survey-questions, /survey-response
          '/consumption',// covers /consumption-log, /consumption-summary, etc.
          '/health',
          '/today',      // daily-tasks "today" endpoint in this app
        ];

        return Object.fromEntries(prefixes.map((p) => [p, proxyFor()]));
      })(),

      // Keep /admin as a special case: the exact /admin route is a frontend page,
      // but /admin/* are backend API endpoints.
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