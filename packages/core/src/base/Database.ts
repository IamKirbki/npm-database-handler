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
    return new Table(name);
  }

  /** Create a Query object for executing custom SQL */
  public Query(table: Table, query: string): Query {
    return new Query(table, query, this.adapter);
  }
}
