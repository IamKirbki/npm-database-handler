import Table from "./Table";
import { QueryParameters } from "../types/index";
import { Database as SqliteDatabaseType } from "better-sqlite3";
import Record from "./Record";
import Validator from "./Validator";

/**
 * Query class for executing custom SQL queries with parameter validation
 * Validates parameter types against table schema before execution
 * 
 * @example
 * ```typescript
 * const users = db.Table('users');
 * const query = db.Query(users, 'SELECT * FROM users WHERE age > ? AND status = ?');
 * 
 * query.Parameters = { age: 18, status: 'active' };`
 * const results = query.All();
 * ```
 */
export default class Query {
  public readonly Table: Table;
  private readonly db: SqliteDatabaseType;
  private query: string = "";
  public Parameters: QueryParameters = {};

  /**
   * Creates a Query instance
   * 
   * @param Table - Table instance for validation context
   * @param Query - SQL query string with ? placeholders for parameters
   * @param DB - Database connection instance
   * 
   * @example
   * ```typescript
   * const query = new Query(
   *   usersTable, 
   *   'SELECT * FROM users WHERE id = ?',
   *   db
   * );
   * query.Parameters = { id: 1 };
   * ```
   */
  constructor(Table: Table, Query: string, DB: SqliteDatabaseType) {
    this.Table = Table;
    this.query = Query;
    this.db = DB;
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   * 
   * @returns Result object with lastInsertRowid and changes count
   * @throws Error if query or parameters are invalid
   * 
   * @example
   * ```typescript
   * const query = db.Query(users, 'INSERT INTO users (name, age) VALUES (?, ?)');
   * query.Parameters = { name: 'John', age: 30 };
   * const result = query.Run();
   * console.log(`Inserted ID: ${result.lastInsertRowid}`);
   * ```
   */
  public Run<Type>(): Type {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.run(this.Parameters) as Type;
  }

  /**
   * Execute a SELECT query and return all matching rows
   * 
   * @returns Array of row objects
   * @throws Error if query or parameters are invalid
   * 
   * @example
   * ```typescript
   * const query = db.Query(users, 'SELECT * FROM users WHERE age > ?');
   * query.Parameters = { age: 18 };
   * const results = query.All();
   * ```
   */
  public All<Type extends { id: number | string }>(): Record<Type>[] {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    const results = stmt.all(this.Parameters) as Type[];
    return results.map(res => new Record<Type>(res, this.db, this.Table.Name));
  }

  /**
   * Execute a SELECT query and return the first matching row
   * 
   * @returns Single row object or undefined if no match
   * @throws Error if query or parameters are invalid
   * 
   * @example
   * ```typescript
   * const query = db.Query(users, 'SELECT * FROM users WHERE id = ?');
   * query.Parameters = { id: 1 };
   * const user = query.Get();
   * ```
   */
  public Get<Type extends { id: number | string }>(): Record<Type> | undefined {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    const results = stmt.get(this.Parameters) as Type | undefined;
    return results ? new Record<Type>(results, this.db, this.Table.Name) : undefined;
  }

  /**
   * Execute the query for multiple parameter sets in an atomic transaction
   * All operations succeed or all fail together
   * 
   * @param items - Array of parameter objects, one for each execution
   * @returns Transaction result
   * @throws Error if any validation fails
   * 
   * @example
   * ```typescript
   * const query = db.Query(users, 'INSERT INTO users (name, age) VALUES (?, ?)');
   * query.Transaction([
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 }
   * ]);
   * // Both inserts succeed or both fail
   * ```
   */
  public Transaction(items: QueryParameters[]): void {
    const stmt = this.db.prepare(this.query);

    const transactionFn = this.db.transaction((items: QueryParameters[]) => {
      for (const item of items) {
        // Set parameters for this item
        this.Parameters = item;

        // Validate each item
        this.Validate();

        // Run with sorted parameters
        stmt.run(this.Parameters);
      }
    });

    transactionFn(items);
  }

  /**
   * Validate both the query structure and parameter types
   * 
   * @throws Error if query has wrong number of ? placeholders
   * @throws Error if parameters don't match table schema
   */
  public Validate() {
    Validator.ValidateQuery(this.query, this.Table.TableColumnInformation);
    Validator.ValidateQueryParameters(this.Parameters, this.Table.TableColumnInformation);
  }
}
