import SqliteDatabase, { Database as SqliteDatabaseType } from "better-sqlite3";
import Table from "./Table";
import Query from "./Query";

export default class Database {
  private readonly db: SqliteDatabaseType;

  constructor(dbPath: string) {
    this.db = new SqliteDatabase(dbPath);
  }

  /**
   * @param name Name of the table
   * @returns A table object
   */
  public Table(name: string): Table {
    return new Table(name, this.db);
  }

  public CreateTable(name: string): Table {
    const stmt = this.db.prepare(
      `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT);`
    );

    stmt.run();
    return new Table(name, this.db);
  }

  /**
   * @description Creates a query object for manual SQL queries
   * @param table Name of the table you want to create a query for
   * @param query The SQL query string
   * @returns A query object
   */
  public Query(table: string, query: string): Query {
    return new Query(table, query, this.db);
  }
}
