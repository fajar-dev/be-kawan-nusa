// PM2 process manager — production deployment.
//
//   bun run build                                  # produce dist/index.js
//   pm2 start ecosystem.config.js --env production # start the API
//   pm2 save && pm2 startup                        # persist across reboots
//
// The API writes structured JSON to stdout AND to logs/app-YYYY-MM-DD.log
// (see src/core/helpers/logger.ts). Promtail tails those files into Loki
// (see deploy/promtail-config.yaml). Scheduled jobs are NOT managed here —
// register them in crontab (see src/jobs/index.ts and README "Production").

module.exports = {
  apps: [
    {
      name: "kawan-nusa-be",
      script: "dist/index.js",
      interpreter: "bun",

      // Bun does not support PM2 cluster mode reliably; run a single fork.
      // The API is stateless (JWT), so scale horizontally behind a load
      // balancer with multiple hosts rather than cluster instances.
      exec_mode: "fork",
      instances: 1,

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000,

      env: {
        NODE_ENV: "production",
        // LOG_TO_FILE: "false",  // uncomment to log to stdout only (let PM2 own the file)
      },
      env_production: {
        NODE_ENV: "production",
      },

      // PM2's own capture of stdout/stderr — mainly a safety net for runtime
      // crashes / bun errors that bypass the app logger. The Loki source of
      // truth is logs/app-*.log, so Promtail should tail that, not these.
      out_file: "logs/pm2-out.log",
      error_file: "logs/pm2-error.log",
      merge_logs: true,
      time: false, // the app logger already timestamps every JSON line
    },
  ],
};
