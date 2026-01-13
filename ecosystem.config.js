// =============================================================================
// Configuración PM2 para WhatsApp Bot Wimpy
// =============================================================================
// Uso (alternativa a Docker):
//   npm install -g pm2
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup
// =============================================================================

module.exports = {
  apps: [
    {
      name: 'wimpy-chatbot',
      script: 'server.js',
      instances: 1, // Solo 1 instancia (WhatsApp requiere una sola conexión)
      autorestart: true,
      watch: false, // No reiniciar en cambios de archivos
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Configuración de logs
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_file: './logs/combined.log',
      time: true,
      // Reinicio automático en caso de crash
      exp_backoff_restart_delay: 100,
      // Límite de reinicios
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};
