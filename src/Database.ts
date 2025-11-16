import SqliteDatabase, { Database as SqliteDatabaseType } from "better-sqlite3";
import Table from "./Table";
import Query from "./Query";

/**
 * Main Database class for interacting with SQLite databases
 * 
 * @example
 * ```typescript
 * import { Database } from 'kirbkis-bettersqlite3-handler';
 * 
 * // Create or open a database
 * const db = new Database('./myapp.db');
 * 
 * // Access a table
 * const users = db.Table('users');
 * 
 * // Create a new table
 * const posts = db.CreateTable('posts');
 * ```
 */
export default class Database {
  public readonly db: SqliteDatabaseType;

  /**
   * Creates a new Database instance
   * 
   * @param dbPath - Path to the SQLite database file (absolute or relative to process.cwd())
   * 
   * @example
   * ```typescript
   * // Relative path
   * const db = new Database('./data/app.db');
   * 
   * // Absolute path
   * const db = new Database('/var/data/app.db');
   * 
   * // In-memory database
   * const db = new Database(':memory:');
   * ```
   */
  constructor(dbPath: string) {
    this.db = new SqliteDatabase(dbPath);
  }

  /**
   * Get a Table instance to interact with an existing table
   * 
   * @param name - Name of the table
   * @returns Table instance for querying and manipulating data
   * @throws Error if the table does not exist
   * 
   * @example
   * ```typescript
   * const users = db.Table('users');
   * const allUsers = users.Records();
   * ```
   */
  public Table(name: string): Table {
    return new Table(name, this.db);
  }

  /**
   * Create a new table with an auto-incrementing ID column
   * 
   * @param name - Name of the table to create
   * @returns Table instance for the newly created table
   * 
   * @example
   * ```typescript
   * const posts = db.CreateTable('posts');
   * // Table 'posts' now exists with an 'id' column
   * ```
   */
  //@TODO: Add ability to define additional columns during table creation
  public CreateTable(name: string, columns?: object): Table {
    const names = Object.keys(columns || {});
    const colsDef = ", " + names.map(colName => {
      const colType = (columns as Record<string, string>)[colName];
      return `${colName} ${colType}`;
    }).join(", ");

    const stmt = this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT${colsDef !== ', ' ? colsDef : ''});`
    );

    stmt.run();
    return new Table(name, this.db);
  }

  /**
   * Create a Query object for executing custom SQL queries
   * 
   * @param table - Table object for validation and context
   * @param query - The SQL query string with ? placeholders
   * @returns Query instance for executing the query
   * 
   * @example
   * ```typescript
   * const users = db.Table('users');
   * const query = db.Query(users, 'SELECT * FROM users WHERE age > ? AND status = ?');
   * query.Parameters = { age: 18, status: 'active' };
   * const results = query.All();
   * ```
   */
  public Query(table: Table, query: string): Query {
    return new Query(table, query, this.db);
  }
}
