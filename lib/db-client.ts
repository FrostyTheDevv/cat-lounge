import { createClient, Client } from '@libsql/client';

// Turso database client
let tursoClient: Client | null = null;

export function getTursoClient(): Client {
  if (!tursoClient) {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl || !dbAuthToken) {
      throw new Error('Missing Turso credentials: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');
    }

    tursoClient = createClient({
      url: dbUrl,
      authToken: dbAuthToken,
    });
  }

  return tursoClient;
}

// Helper to execute a query and return all rows
export async function queryAll<T = any>(sql: string, args: any[] = []): Promise<T[]> {
  const client = getTursoClient();
  const result = await client.execute({ sql, args });
  return result.rows as T[];
}

// Helper to execute a query and return first row
export async function queryFirst<T = any>(sql: string, args: any[] = []): Promise<T | null> {
  const client = getTursoClient();
  const result = await client.execute({ sql, args });
  return (result.rows[0] as T) || null;
}

// Helper to execute a statement (INSERT, UPDATE, DELETE)
export async function execute(sql: string, args: any[] = []) {
  const client = getTursoClient();
  return await client.execute({ sql, args });
}

// Helper to execute multiple statements in a transaction
export async function transaction(statements: Array<{ sql: string; args?: any[] }>) {
  const client = getTursoClient();
  const results = [];
  
  for (const stmt of statements) {
    const result = await client.execute({ sql: stmt.sql, args: stmt.args || [] });
    results.push(result);
  }
  
  return results;
}

export { tursoClient };
