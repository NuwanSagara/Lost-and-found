const { Pool } = require('pg');
const { schemaSql } = require('./schema');

let pool = null;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (hasDatabaseUrl) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
}

const getPool = () => {
    if (!pool) {
        throw new Error('DATABASE_URL is not configured. PostgreSQL features are disabled.');
    }

    return pool;
};

const query = async (text, params = []) => getPool().query(text, params);

const ensurePostgresSchema = async () => {
    if (!pool) {
        console.warn('DATABASE_URL not set. Skipping PostgreSQL schema bootstrap.');
        return;
    }

    await pool.query(schemaSql);
    console.log('PostgreSQL schema ready');
};

module.exports = {
    hasDatabaseUrl,
    getPool,
    query,
    ensurePostgresSchema,
};
