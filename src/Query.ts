import Table from "./Table";
import { QueryParameters, QueryValues } from "../types/index";
import { Database as SqliteDatabaseType } from "better-sqlite3";

/**
 * Query class for executing custom SQL queries with parameter validation
 * Validates parameter types against table schema before execution
 * 
 * @example
 * ```typescript
 * const users = db.Table('users');
 * const query = db.Query(users, 'SELECT * FROM users WHERE age > ? AND status = ?');
 * 
 * query.Parameters = { age: 18, status: 'active' };
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
  public Run(): any {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.run(...this.SortParameters());
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
  public All(): any {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.all(...this.SortParameters());
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
  public Get(): any {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.get(...this.SortParameters());
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
  public Transaction(items: QueryParameters[]): any {
    const stmt = this.db.prepare(this.query);
    
    const transactionFn = this.db.transaction((items: QueryParameters[]) => {
      for (const item of items) {
        // Set parameters for this item
        this.Parameters = item;
        
        // Validate each item
        this.Validate();
        
        // Run with sorted parameters
        stmt.run(...this.SortParameters());
      }
    });
    
    return transactionFn(items);
  }

  /**
   * Validate both the query structure and parameter types
   * 
   * @throws Error if query has wrong number of ? placeholders
   * @throws Error if parameters don't match table schema
   */
  public Validate() {
    if (!this.ValidateQuery()) {
      throw new Error("Query is not valid.");
    }

    if (!this.ValidateParameters()) {
      throw new Error("Parameters are not valid.");
    }
  }

  /**
   * Validate that the number of ? placeholders matches the number of parameters
   * 
   * @returns true if valid, false otherwise
   */
  private ValidateQuery(): boolean {
    return (
      this.query.split("").filter((char) => char === "?").length ===
      Object.keys(this.Parameters).length
    ) || (Object.keys(this.Parameters).length < 0 && Object.keys(this.Parameters).length <= 0);
  }

  /**
   * Validate parameter types and required fields against table schema
   * 
   * @returns true if all parameters are valid, false otherwise
   */
  private ValidateParameters(): boolean {
    for (const [key, val] of Object.entries(this.Parameters)) {
      const tableColumn = this.Table.TableColumnInformation.find(
        (col) => col.name === key
      );

      if (
        (!val && tableColumn?.notnull === 1) ||
        (!this.CompareTypes(tableColumn?.type, typeof val) && val)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Extract parameter values in the correct order to match ? placeholders
   * Searches the query for column names and extracts corresponding values
   * 
   * @returns Array of parameter values in order
   */
  private SortParameters(): QueryValues[] {
    const queryWords = this.query.split(" ");
    const sortedParameters: QueryValues[] = [];

    for (const word of queryWords) {
      const paramKey = word.replace(/[(),]/g, "");
      if (this.Parameters[paramKey]) {
        sortedParameters.push(this.Parameters[paramKey]);
      }
    }

    return sortedParameters;
  }

  /**
   * Compare a database column type with a JavaScript parameter type
   * 
   * @param columnType - SQLite column type (VARCHAR, INTEGER, etc.)
   * @param parameterType - JavaScript typeof result (string, number, etc.)
   * @returns true if types are compatible, false otherwise
   */
  private CompareTypes(columnType?: string, parameterType?: string): boolean {
    if (!columnType || !parameterType) {
      return false;
    }

    switch (columnType.toLowerCase()) {
      case "varchar":
        return parameterType === "string";
      case "integer":
        return parameterType === "number";
      case "boolean":
        return parameterType === "boolean";
      case "uuid":
        return (
          parameterType.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          ) !== null
        );
      default:
        return false;
    }
  }
}
