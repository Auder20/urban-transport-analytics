const fs = require('fs');
const path = require('path');

class MigrationTracker {
  constructor(pool) {
    this.pool = pool;
  }

  async initialize() {
    // Create migrations table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  async getExecutedMigrations() {
    const result = await this.pool.query(
      'SELECT filename FROM schema_migrations ORDER BY executed_at'
    );
    return result.rows.map(row => row.filename);
  }

  async markMigrationExecuted(filename) {
    await this.pool.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
  }

  async runMigrations() {
    await this.initialize();
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migration(s)...`);
    
    for (const file of pendingMigrations) {
      try {
        console.log(`📝 Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Start transaction for each migration
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (filename) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`✅ Migration ${file} applied successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error(`❌ Failed to apply migration ${file}:`, error.message);
        throw error;
      }
    }

    console.log('✅ All migrations applied successfully');
  }

  async rollbackMigration(filename) {
    // This would be implemented for rollback functionality
    // For now, migrations are designed to be forward-only
    throw new Error('Rollback not implemented. Migrations are designed to be forward-only.');
  }
}

module.exports = MigrationTracker;
