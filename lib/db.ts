import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

// Singleton pool instance for Next.js hot-reloading development
declare global {
  var __mysqlPool: Pool | undefined;
}

const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbPort = parseInt(process.env.DB_PORT || "3306", 10);
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD ?? "";
const dbName = process.env.DB_NAME || "sahabat_mahasiswa";

export function getPool(): Pool {
  if (!global.__mysqlPool) {
    global.__mysqlPool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: "+07:00",
    });
  }
  return global.__mysqlPool;
}

export const pool = getPool();

/**
 * Execute a query with prepared statement
 */
export async function query<T = RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const p = getPool();
  const [rows] = await p.execute(sql, params as (string | number | boolean | null)[]);
  return rows as unknown as T;
}

/**
 * Helper for INSERT/UPDATE/DELETE queries returning ResultSetHeader
 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<ResultSetHeader> {
  const p = getPool();
  const [result] = await p.execute(sql, params as (string | number | boolean | null)[]);
  return result as ResultSetHeader;
}

export default pool;
