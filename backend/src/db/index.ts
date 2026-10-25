import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { newDb, IMemoryDb } from 'pg-mem';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

let pool: Pool;
let isInMemoryMode = false;
let memDbInstance: IMemoryDb | null = null;

function createInMemoryPool(): Pool {
  console.log('🔄 Initializing in-memory PostgreSQL engine (pg-mem)...');
  const db = newDb();

  // Register common PostgreSQL functions
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: db.public.getType('uuid' as any),
    impure: true,
    implementation: () => uuidv4()
  });

  db.public.registerFunction({
    name: 'current_database',
    implementation: () => 'miniledger_memory'
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 16.0 (pg-mem in-memory)'
  });

  memDbInstance = db;
  const pgAdapter = db.adapters.createPg();
  const memoryPool = new pgAdapter.Pool();

  isInMemoryMode = true;
  return memoryPool as unknown as Pool;
}

export async function initializeDatabase(): Promise<void> {
  const schemaCandidates = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, '../src/db/schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql')
  ];
  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p)) || schemaCandidates[0];
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (process.env.USE_IN_MEMORY_DB === 'true' || config.nodeEnv === 'test') {
    pool = createInMemoryPool();
    // pg-mem doesn't need timezone parsing in timestamp with timezone
    const simplifiedSql = schemaSql
      .replace(/WITH TIME ZONE/gi, '')
      .replace(/gen_random_uuid\(\)/gi, 'gen_random_uuid()');
    
    // Execute DDL statements one by one for pg-mem compatibility
    const statements = simplifiedSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log('✅ In-memory PostgreSQL initialized with schema.');
    return;
  }

  try {
    console.log(`🔌 Attempting to connect to PostgreSQL at ${config.databaseUrl}...`);
    const livePool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000
    });

    // Test connection with timeout
    const testClient = await livePool.connect();
    testClient.release();

    pool = livePool;
    isInMemoryMode = false;
    console.log('✅ Connected to live PostgreSQL server.');

    // Execute schema migrations
    await pool.query(schemaSql);
    console.log('✅ Database schema verified / created successfully.');
  } catch (error: any) {
    console.warn(`⚠️ Could not connect to live PostgreSQL (${error.message}).`);
    console.warn('⚡ Seamlessly falling back to built-in in-memory PostgreSQL (pg-mem).');
    
    pool = createInMemoryPool();
    const simplifiedSql = schemaSql
      .replace(/WITH TIME ZONE/gi, '');
    
    const statements = simplifiedSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log('✅ In-memory PostgreSQL initialized with schema.');
  }
}

export const db = {
  async query<R extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<R>> {
    if (!pool) {
      await initializeDatabase();
    }
    return pool.query<R>(text, params);
  },

  async getClient(): Promise<PoolClient> {
    if (!pool) {
      await initializeDatabase();
    }
    return pool.connect();
  },

  async close(): Promise<void> {
    if (pool) {
      await pool.end();
    }
  },

  isInMemory(): boolean {
    return isInMemoryMode;
  },

  getMemDb(): IMemoryDb | null {
    return memDbInstance;
  }
};
