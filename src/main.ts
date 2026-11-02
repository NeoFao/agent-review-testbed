import { loadConfig } from './config.ts';
import { openDb } from './db.ts';
import { buildServer } from './server.ts';
import { createUser } from './users.ts';

const config = loadConfig();
const db = openDb();
createUser(db, 'alice', 'alice-password', 'admin');
buildServer(db, config).listen(config.port, () => {
  console.log(`listening on http://localhost:${config.port}`);
});
