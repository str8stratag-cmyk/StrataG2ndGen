import { query, initializeDatabase } from '../backend/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    await initializeDatabase();
    console.log('✅ Database connection established');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + ';');

    for (const statement of statements) {
      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.startsWith('/*')) continue;
      try {
        await query(statement);
        console.log('✅ Executed:', statement.substring(0, 80).replace(/\n/g, ' ') + '...');
      } catch (err) {
        // Ignore "already exists" errors for idempotency
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log('⚠️  Skipped (already exists):', statement.substring(0, 60).replace(/\n/g, ' '));
        } else {
          console.error('❌ Error:', err.message);
          console.error('Statement:', statement.substring(0, 100));
        }
      }
    }

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
