const { Pool, types } = require('pg');
require('dotenv').config();

types.setTypeParser(20, value => parseInt(value, 10));
types.setTypeParser(1700, value => parseFloat(value));

const host = process.env.PGHOST || process.env.DB_HOST || '';
const sslMode = process.env.PGSSLMODE;
const useSsl = sslMode
  ? sslMode !== 'disable'
  : Boolean(process.env.DATABASE_URL || host.includes('supabase.co'));

const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: Number(process.env.PG_POOL_MAX) || 10,
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 10000
    }
  : {
      host: process.env.PGHOST || process.env.DB_HOST,
      port: Number(process.env.PGPORT || process.env.DB_PORT) || 5432,
      database: process.env.PGDATABASE || process.env.DB_NAME,
      user: process.env.PGUSER || process.env.DB_USER,
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      ssl: sslConfig,
      max: Number(process.env.PG_POOL_MAX) || 10,
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 10000
    };

const pool = new Pool(poolConfig);

const queryResult = (text, params = []) => pool.query(text, params);

const query = async (text, params = []) => {
  const result = await queryResult(text, params);
  return result.rows;
};

module.exports = {
  pool,
  query,
  queryResult,
  getClient: () => pool.connect()
};
