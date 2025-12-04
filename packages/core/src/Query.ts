import Table from "@core/Table";
import { QueryParameters } from "./types/index";
import Record from "@core/Record";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";

/**
 * Query class for executing custom SQL queries
 * 
 * Features:
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
  private readonly adapter: IDatabaseAdapter;
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
  constructor(Table: Table, Query: string, adapter: IDatabaseAdapter) {
    this.Table = Table;
    this.query = Query;
    this.adapter = adapter;
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   * 
   * @template Type - Expected return type (typically { lastInsertRowid: number, changes: number })
   * @returns Result object with lastInsertRowid and changes count
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
    const stmt = this.adapter.prepare(this.query);
    return stmt.run(this.Parameters) as Type;
  }

  /**
   * Execute a SELECT query and return all matching rows as Record objects
   * Each row is wrapped in a Record instance for convenient updates/deletes
   * 
   * @template Type - Expected row type
   * @returns Array of Record objects containing the query results
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
  public All<Type>(): Record<Type>[] {
    const stmt = this.adapter.prepare(this.query);
    let results = stmt.all(this.Parameters) as Type[];

    // This is a fix for a bug where id's passed as numbers don't match string ids in the db
    if (results.length === 0 && this.Parameters.id) {
      this.Parameters.id = this.Parameters.id.toString();
      results = stmt.all(this.Parameters) as Type[];
    }

    return results.map(res => new Record<Type>(res, this.adapter, this.Table));
  }

  /**
   * Execute a SELECT query and return the first matching row as a Record object
   * Returns undefined if no rows match the query
   * 
   * @template Type - Expected row type
   * @returns Single Record object or undefined if no match found
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
  public Get<Type>(): Record<Type> | undefined {
    const stmt = this.adapter.prepare(this.query);
    const results = stmt.get(this.Parameters) as Type | undefined;
    return results ? new Record<Type>(results, this.adapter, this.Table) : undefined;
  }

  public Transaction(paramList: QueryParameters[]): void {
    const stmt = this.adapter.prepare(this.query);
    const transaction = this.adapter.transaction((paramsArray: QueryParameters[]) => {
      for (const params of paramsArray) {
        stmt.run(params);
      }
    });
    
    transaction(paramList);
  }
}
