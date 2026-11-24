import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { compression } from 'vite-plugin-compression2';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/SGRD-Municipio-de-Goiana/',
  plugins: [
    react(),
    // Minimal polyfills: only buffer/process needed by xlsx-populate & deps.
    // crypto, stream, util, events are native in modern browsers (es2022 target).
    nodePolyfills({
      include: ['buffer', 'process'],
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
    // Gzip + Brotli compression for production assets
    compression({
      algorithms: ['gzip', 'brotliCompress'],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
    // PWA / Service Worker for offline caching
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-goiana.png', 'icons.svg'],
      manifest: {
        name: 'SGRD - Defesa Civil de Goiana',
        short_name: 'SGRD Goiana',
        description: 'Sistema de Redução de Riscos de Desastres - Monitoramento social de famílias',
        theme_color: '#126bd3',
        background_color: '#f1f5f8',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo-goiana.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Cache map tiles and static assets for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache OpenStreetMap tiles
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache APAC API responses
            urlPattern: /^https:\/\/geoportal\.apac\.pe\.gov\.br\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'apac-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 6, // 6 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache font files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Skip waiting for new SW to activate immediately
        skipWaiting: true,
        clientsClaim: true,
        // Cleanup old caches
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: { allowedHosts: ['terminal.local'] },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies for faster dev startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'leaflet',
      'leaflet.markercluster',
      'lucide-react',
      'zod',
      'xlsx-populate',
    ],
  },
  build: {
    // Optimize chunk sizes and enable advanced minification
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    // Generate sourcemaps for production debugging (hidden from users)
    sourcemap: 'hidden',
    // Optimize chunk splitting
    rollupOptions: {
      external: ['fs'],
      output: {
        // Manual chunk splitting for better caching (function form for TS compatibility)
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet')) {
              return 'vendor-map';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
              return 'vendor-form';
            }
            if (id.includes('xlsx-populate')) {
              return 'vendor-excel';
            }
            if (id.includes('jszip') || id.includes('@xmldom/xmldom')) {
              return 'vendor-utils';
            }
            return 'vendor-misc';
          }
          return undefined;
        },
        // Optimize chunk file names for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          const info = name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(name)) {
            return `assets/img/[name]-[hash].${ext}`;
          }
          if (/\.(css)$/.test(name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|ttf|eot)$/.test(name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[ext]/[name]-[hash].${ext}`;
        },
      },
    },
    // Increase chunk size warning limit (default 500kb)
    chunkSizeWarningLimit: 800,
    // Target modern browsers for smaller output
    target: 'es2022',
    // Enable module preloading
    modulePreload: {
      polyfill: false,
    },
  },
  // Enable experimental features for better performance
  experimental: {
    // Use native Node.js module resolution
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}`, css: `/${filename}` };
      }
      return { relative: true };
    },
  },
});