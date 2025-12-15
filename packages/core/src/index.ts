/**
 * kirbkis-bettersqlite3-handler
 * A TypeScript wrapper for better-sqlite3 with type-safe operations and parameter validation
 * 
 * Features:
 * - Type-safe database operations with TypeScript generics
 * - Automatic parameter validation against table schema
 * - SQL injection prevention through query validation
 * - Named parameters using @fieldName syntax
 * - Record-based API for easy updates and deletes
 * - Transaction support for atomic operations
 * - Comprehensive error messages for debugging
 * 
 * @example
 * ```typescript
 * import { Database } from 'kirbkis-bettersqlite3-handler';
 * 
 * // Create/open database
 * const db = new Database('./myapp.db');
 * 
 * // Create table
 * const users = db.CreateTable('users', {
 *   id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
 *   name: 'TEXT NOT NULL',
 *   email: 'TEXT UNIQUE',
 *   age: 'INTEGER'
 * });
 * 
 * // Insert data
 * users.Insert({ name: 'John', email: 'john@example.com', age: 30 });
 * 
 * // Query data
 * const activeUsers = users.Records({ where: { age: 30 } });
 * 
 * // Update record
 * const user = users.Record({ where: { id: 1 } });
 * user?.Update({ age: 31 });
 * 
 * // Custom query
 * const query = db.Query(users, 'SELECT * FROM users WHERE age > @minAge');
 * query.Parameters = { minAge: 25 };
 * const results = query.All();
 * ```
 * 
 * @packageDocumentation
 */

import Database from "./base/Database.js";
import Table from "./base/Table.js";
import Record from "./base/Record.js";
import Query from "./base/Query.js";

import IDatabaseAdapter from "./interfaces/IDatabaseAdapter.js";
import IStatementAdapter from "./interfaces/IStatementAdapter.js";

import Model from "./abstract/Model.js";
import Migration from "./abstract/Migration.js";

import IController from "./interfaces/IController.js";
export * from "./abstract/Schema.js";

export { Database, Model, IDatabaseAdapter, IStatementAdapter, Table, Query, Record, IController, Migration };

export * from "./types/index.js";