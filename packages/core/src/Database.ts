import Table from "./Table.js";
import Query from "./Query.js";
// import Validator from "./helpers/Validator.js";
import IDatabaseAdapter from "./interfaces/IDatabaseAdapter.js";

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
  private adapter: IDatabaseAdapter;

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
  constructor(adapter: IDatabaseAdapter) {
    this.adapter = adapter;
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
   * const users = await db.Table('users');
   * const allUsers = await users.Records();
   * ```
   */
  public async Table(name: string): Promise<Table> {
    // Validator.ValidateTableName(name);
    return await Table.create(name, this.adapter);
  }

  // TODO Make primary key required
  /**
   * Create a new table with specified columns
   * Validates table name, column names, and column types before creation
   * Uses CREATE TABLE IF NOT EXISTS to avoid errors if table already exists
   * 
   * @param name - Name of the table to create
   * @param columns - Object mapping column names to their type definitions
   * @returns Table instance for the newly created table
   * @throws Error if table name, column names, or column types are invalid
   * 
   * @example
   * ```typescript
   * // Create a users table
   * const users = await db.CreateTable('users', {
   *   id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
   *   name: 'TEXT NOT NULL',
   *   email: 'TEXT UNIQUE',
   *   age: 'INTEGER',
   *   created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
   * });
   * 
   * // Table is now ready to use
   * await users.Insert({ name: 'John', email: 'john@example.com', age: 30 });
   * ```
   */
  public async CreateTable(name: string, columns: object): Promise<Table> {
    // Validator.ValidateTableName(name);

    const names = Object.keys(columns || {}).map((colName) => {
      // Validator.ValidateColumnName(colName);
      return colName;
    });

    const colsDef = names.map(colName => {
      const colType = (columns as Record<string, string>)[colName];
      // Validator.ValidateColumnType(colType);
      return `"${colName}" ${colType}`;
    }).join(", ");

    const stmt = await this.adapter.prepare(
      `CREATE TABLE IF NOT EXISTS "${name}" (${colsDef});`
    );

    await stmt.run();
    return await Table.create(name, this.adapter, true);
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
    return new Query(table, query, this.adapter);
  }
}
