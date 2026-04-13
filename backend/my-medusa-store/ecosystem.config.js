/**
 * PM2 Ecosystem Configuration for Marqa Souq
 * 
 * IMPORTANT: Medusa v2 Production Architecture
 * - Backend MUST run from .medusa/server/ directory (built output)
 * - Admin UI is bundled with backend and served at /app
 * - Frontend runs as separate Next.js application
 * 
 * Deployment Steps:
 * 1. cd backend/my-medusa-store && yarn build
 * 2. cp .env .medusa/server/.env
 * 3. cd .medusa/server && yarn install --production
 * 4. pm2 restart medusa-backend
 */
module.exports = {
  apps: [
    {
      name: 'medusa-backend',
      // CRITICAL: Run from the built server directory, NOT the source
      cwd: '/var/www/marqa-souq/backend/my-medusa-store/.medusa/server',
      script: './node_modules/.bin/medusa',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9000
      },
      error_file: '/var/log/pm2/medusa-error.log',
      out_file: '/var/log/pm2/medusa-out.log',
      time: true,
      // Graceful restart configuration
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 30000,
      // Restart on memory limit
      exp_backoff_restart_delay: 100,
    },
    {
      name: 'nextjs-storefront',
      cwd: '/var/www/marqa-souq/frontend/markasouq-web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/nextjs-error.log',
      out_file: '/var/log/pm2/nextjs-out.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ]
};
