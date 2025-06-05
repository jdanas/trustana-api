import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function waitForDatabase(maxRetries = 30, delay = 2000) {
  console.log('Waiting for PostgreSQL to be ready...');
  
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await execAsync('docker-compose exec -T postgres pg_isready -U postgres -d trustana_db');
      console.log('✅ PostgreSQL is ready!');
      return true;
    } catch {
      console.log(`⏳ PostgreSQL is not ready yet. Waiting... (${i}/${maxRetries})`);
      if (i === maxRetries) {
        console.error('❌ PostgreSQL failed to start within the timeout period');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  waitForDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { waitForDatabase };
