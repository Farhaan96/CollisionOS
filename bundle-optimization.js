
// Bundle Size Optimization for CollisionOS

// 1. Webpack configuration optimizations
const webpackConfig = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    },
    usedExports: true,
    sideEffects: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'services': path.resolve(__dirname, 'src/services'),
      'utils': path.resolve(__dirname, 'src/utils')
    }
  }
};

// 2. Tree shaking configuration
// Add to package.json:
{
  "sideEffects": false,
  "module": "src/index.js"
}

// 3. Dynamic imports for code splitting
const LazyDashboard = React.lazy(() => import('./pages/Dashboard'));
const LazyRepairOrders = React.lazy(() => import('./pages/RepairOrders'));
const LazyCustomers = React.lazy(() => import('./pages/Customers'));

// 4. Material-UI tree shaking
import { Button, TextField, Card } from '@mui/material';
// Instead of: import * as MUI from '@mui/material';

// 5. Lodash tree shaking
import { debounce, throttle } from 'lodash';
// Instead of: import _ from 'lodash';

// 6. Bundle analysis
// Add to package.json scripts:
// "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"

// 7. Compression configuration
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// 8. Image optimization
const sharp = require('sharp');

const optimizeImage = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize(800, 600, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
};

// 9. Service worker for caching
const workboxConfig = {
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  swDest: 'build/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    }
  ]
};
