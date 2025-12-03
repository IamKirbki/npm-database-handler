import Table from "./Table";
import { QueryParameters } from "types/index";
import { Database as DatabaseType } from "better-sqlite3";
import Record from "./Record";
import Validator from "./helpers/Validator";

/**
 * Query class for executing custom SQL queries with parameter validation
 * 
 * Features:
 * - Validates parameter types against table schema before execution
 * - Prevents SQL injection through query structure validation
 * - Supports named parameters using @fieldName syntax
 * - Provides type-safe query execution (Run, All, Get)
 * - Transaction support for atomic multi-insert/update operations
 * 
 * @example
 * ```typescript
 * const users = db.Table('users');
 * 
 * // SELECT query with parameters
 * const query = db.Query(users, 'SELECT * FROM users WHERE age > @age AND status = @status');
 * query.Parameters = { age: 18, status: 'active' };
 * const results = query.All();
 * 
 * // INSERT query
 * const insert = db.Query(users, 'INSERT INTO users (name, email) VALUES (@name, @email)');
 * insert.Parameters = { name: 'John', email: 'john@example.com' };
 * insert.Run();
 * 
 * // Transaction for multiple inserts
 * insert.Transaction([
 *   { name: 'John', email: 'john@example.com' },
 *   { name: 'Jane', email: 'jane@example.com' }
 * ]);
 * ```
 */
export default class Query {
  public readonly Table: Table;
  private readonly db: DatabaseType;
  private query: string = "";
  public Parameters: QueryParameters = {};

  /**
   * Creates a Query instance (usually called via db.Query() method)
   * 
   * @param Table - Table instance for validation context
   * @param Query - SQL query string with @fieldName placeholders for parameters
   * @param DB - Database connection instance
   * 
   * @example
   * ```typescript
   * // Direct instantiation (not recommended - use db.Query() instead)
   * const query = new Query(
   *   usersTable, 
   *   'SELECT * FROM users WHERE id = @id',
   *   db
   * );
   * query.Parameters = { id: 1 };
   * 
   * // Recommended approach
   * const query = db.Query(usersTable, 'SELECT * FROM users WHERE id = @id');
   * query.Parameters = { id: 1 };
   * ```
   */
  constructor(Table: Table, Query: string, DB: DatabaseType) {
    this.Table = Table;
    this.query = Query;
    this.db = DB;
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   * Validates query and parameters before execution
   * 
   * @template Type - Expected return type (typically { lastInsertRowid: number, changes: number })
   * @returns Result object with lastInsertRowid and changes count
   * @throws Error if query validation fails
   * @throws Error if parameter types don't match column types
   * @throws Error if required parameters are missing
   * 
   * @example
   * ```typescript
   * // INSERT query
   * const query = db.Query(users, 'INSERT INTO users (name, age) VALUES (@name, @age)');
   * query.Parameters = { name: 'John', age: 30 };
   * const result = query.Run<{ lastInsertRowid: number, changes: number }>();
   * console.log(`Inserted ID: ${result.lastInsertRowid}`);
   * 
   * // UPDATE query
   * const update = db.Query(users, 'UPDATE users SET age = @age WHERE id = @id');
   * update.Parameters = { age: 31, id: 1 };
   * const updateResult = update.Run<{ changes: number }>();
   * console.log(`Updated ${updateResult.changes} rows`);
   * ```
   */
  public Run<Type>(): Type {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.run(this.Parameters) as Type;
  }

  /**
   * Execute a SELECT query and return all matching rows as Record objects
   * Each row is wrapped in a Record instance for convenient updates/deletes
   * 
   * @template Type - Expected row type (must include id: number | string)
   * @returns Array of Record objects containing the query results
   * @throws Error if query validation fails
   * @throws Error if parameter types don't match column types
   * 
   * @example
   * ```typescript
   * interface User {
   *   id: number;
   *   name: string;
   *   age: number;
   * }
   * 
   * const query = db.Query(users, 'SELECT * FROM users WHERE age > @age');
   * query.Parameters = { age: 18 };
   * const results = query.All<User>();
   * 
   * // Each result is a Record object
   * results.forEach(user => {
   *   console.log(user.values); // { id: 1, name: 'John', age: 30 }
   *   user.Update({ age: 31 }); // Can update directly
   * });
   * ```
   */
  public All<Type extends { id: number | string }>(): Record<Type>[] {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    const results = stmt.all(this.Parameters) as Type[];
    return results.map(res => new Record<Type>(res, this.db, this.Table));
  }

  /**
   * Execute a SELECT query and return the first matching row as a Record object
   * Returns undefined if no rows match the query
   * 
   * @template Type - Expected row type (must include id: number | string)
   * @returns Single Record object or undefined if no match found
   * @throws Error if query validation fails
   * @throws Error if parameter types don't match column types
   * 
   * @example
   * ```typescript
   * interface User {
   *   id: number;
   *   name: string;
   *   email: string;
   * }
   * 
   * const query = db.Query(users, 'SELECT * FROM users WHERE id = @id');
   * query.Parameters = { id: 1 };
   * const user = query.Get<User>();
   * 
   * if (user) {
   *   console.log(user.values); // { id: 1, name: 'John', email: 'john@example.com' }
   *   user.Update({ email: 'newemail@example.com' });
   * }
   * ```
   */
  public Get<Type extends { id: number | string }>(): Record<Type> | undefined {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    const results = stmt.get(this.Parameters) as Type | undefined;
    return results ? new Record<Type>(results, this.db, this.Table) : undefined;
  }

  /**
   * Execute the query for multiple parameter sets in an atomic transaction
   * All operations succeed or all fail together (rollback on any error)
   * Each parameter set is validated before execution
   * 
   * Performance: Significantly faster than individual inserts for bulk operations
   * 
   * @param items - Array of parameter objects, one for each query execution
   * @throws Error if any validation fails for any parameter set
   * @throws Error if any query execution fails (triggers rollback)
   * 
   * @example
   * ```typescript
   * // Bulk insert users
   * const query = db.Query(users, 'INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
   * query.Transaction([
   *   { name: 'John', email: 'john@example.com', age: 30 },
   *   { name: 'Jane', email: 'jane@example.com', age: 25 },
   *   { name: 'Bob', email: 'bob@example.com', age: 35 }
   * ]);
   * // All 3 users inserted, or none if any fails
   * 
   * // Bulk update
   * const update = db.Query(users, 'UPDATE users SET status = @status WHERE id = @id');
   * update.Transaction([
   *   { id: 1, status: 'active' },
   *   { id: 2, status: 'inactive' },
   *   { id: 3, status: 'active' }
   * ]);
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
   * Called automatically by Run(), All(), Get(), and Transaction()
   * Can also be called manually to check validity before execution
   * 
   * Validations performed:
   * - Query is a non-empty string
   * - No SQL injection patterns (semicolon followed by DROP/DELETE/UPDATE/INSERT/ALTER)
   * - All @fieldName references exist in the table schema
   * - All required (NOT NULL) fields are provided for INSERT queries
   * - All parameter keys match column names in the table
   * - All parameter values match their column types (string for TEXT, number for INTEGER, etc.)
   * - No null/undefined values for NOT NULL columns
   * 
   * @throws Error if query structure is invalid or contains forbidden operations
   * @throws Error if parameters don't match table schema
   * @throws Error if parameter types don't match column types
   * @throws Error if required fields are missing
   * 
   * @example
   * ```typescript
   * const query = db.Query(users, 'INSERT INTO users (name, age) VALUES (@name, @age)');
   * query.Parameters = { name: 'John', age: 30 };
   * 
   * // Validate without executing
   * try {
   *   query.Validate();
   *   console.log('Query is valid');
   * } catch (error) {
   *   console.error('Validation failed:', error.message);
   * }
   * ```
   */
  public Validate() {
    Validator.ValidateQuery(this.query, this.Table.TableColumnInformation);
    Validator.ValidateQueryParameters(this.query, this.Parameters, this.Table.TableColumnInformation);
  }
}
