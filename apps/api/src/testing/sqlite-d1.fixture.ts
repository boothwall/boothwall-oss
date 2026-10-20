/**
 * Tests only: the slice of the D1 binding drizzle's D1 driver uses (`prepare`, `bind`, `run`,
 * `all`, `raw`, `first`, `batch`), backed by an in-memory node:sqlite database. Code under test
 * gets a real `D1Database`-shaped binding, so the app runs exactly as it does in the Worker.
 */
import type { DatabaseSync, SQLInputValue, StatementSync } from "node:sqlite";

type Row = Record<string, unknown>;

class SqliteD1Statement {
  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new SqliteD1Statement(this.sqlite, this.sql, params as SQLInputValue[]);
  }

  private prepare(): StatementSync {
    return this.sqlite.prepare(this.sql);
  }

  async run() {
    const { changes, lastInsertRowid } = this.prepare().run(...this.params);
    return { success: true, results: [], meta: { changes, last_row_id: lastInsertRowid } };
  }

  async all<T = Row>() {
    const results = this.prepare().all(...this.params) as T[];
    return { success: true, results, meta: {} };
  }

  async raw<T = unknown[]>() {
    const statement = this.prepare();
    statement.setReturnArrays(true);
    return statement.all(...this.params) as T[];
  }

  async first<T = Row>(column?: string) {
    const row = this.prepare().get(...this.params) as Row | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }
}

/** D1 runs a batch as one transaction; so does this. */
export function sqliteD1(sqlite: DatabaseSync): D1Database {
  let batchTail: Promise<unknown> = Promise.resolve();
  const d1 = {
    prepare: (sql: string) => new SqliteD1Statement(sqlite, sql),
    async batch(statements: SqliteD1Statement[]) {
      const preceding = batchTail;
      let unlock!: () => void;
      batchTail = new Promise<void>((resolve) => {
        unlock = resolve;
      });
      await preceding;
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sqlite.exec("COMMIT");
        return results;
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      } finally {
        unlock();
      }
    },
    async exec(sql: string) {
      sqlite.exec(sql);
      return { count: 0, duration: 0 };
    },
  };
  return d1 as unknown as D1Database;
}
