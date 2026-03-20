const { app, server, io } = require('./app');
const pool = require('./config/database');

const PORT = process.env.PORT || 3001;

// ── Auto-seed on first startup ─────────────────────────────────────────────
// Checks if the database is empty and seeds it automatically.
// FIX: uses spawnSync instead of execSync to avoid blocking the event loop.
// FIX: seed-db.js now uses pg.Client (not pg.Pool) so closing its connection
//      does not affect the server's shared pool.
async function runSeedIfNeeded() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count, 10);

    if (userCount === 0) {
      console.log('🌱 Empty database detected — running initial seed...');
      const { spawnSync } = require('child_process');
      const seedResult = spawnSync('node', ['scripts/seed-db.js'], {
        stdio: 'inherit',
        env: process.env,
        cwd: process.cwd(),
      });
      if (seedResult.status !== 0) {
        console.warn('⚠️  Seed exited with code', seedResult.status, '— continuing anyway');
      } else {
        console.log('✅ Initial seed completed');
      }
    } else {
      console.log(`ℹ️  Database has ${userCount} user(s) — skipping seed`);
    }
  } catch (error) {
    console.warn('⚠️  Could not run auto-seed:', error.message);
  }
}

const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully');

    await runSeedIfNeeded();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Urban Transport Analytics API running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket server ready for real-time updates`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n📡 ${signal} received, shutting down gracefully...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        try {
          await pool.end();
          console.log('🗄️  Database connections closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
      setTimeout(() => {
        console.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();