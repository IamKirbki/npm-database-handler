import Table from "./Table.js";
import Query from "./Query.js";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";

/** Main Database class */
export default class Database {
  public adapter: IDatabaseAdapter;

  constructor(adapter: IDatabaseAdapter) {
    this.adapter = adapter;
  }

  /** Get a Table instance for an existing table */
  public async Table(name: string): Promise<Table> {
    return await Table.create(name, this.adapter);
  }

  /** Create a new table with specified columns */
  public async CreateTable(name: string, columns: object): Promise<Table> {

    const names = Object.keys(columns || {}).map((colName) => {
      return colName;
    });

    const colsDef = names.map(colName => {
      const colType = (columns as Record<string, string>)[colName];
      return `"${colName}" ${colType}`;
    }).join(", ");

    const stmt = await this.adapter.prepare(
      `CREATE TABLE IF NOT EXISTS "${name}" (${colsDef});`
    );

    await stmt.run();
    return await Table.create(name, this.adapter, true);
  }

  /** Create a Query object for executing custom SQL */
  public Query(table: Table, query: string): Query {
    return new Query(table, query, this.adapter);
  }
}
