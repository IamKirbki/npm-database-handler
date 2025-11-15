import Table from "./Table";
import { QueryParameters, QueryValues } from "../types/index";
import { Database as SqliteDatabaseType } from "better-sqlite3";

export default class Query {
  public readonly Table: Table;
  private readonly db: SqliteDatabaseType;
  private query: string = "";
  public Parameters: QueryParameters = {};

  /**
   * @param TableName Name of the table that will be used in the query
   * @param Query The SQL query string
   * @param DB The database connection instance
   */
  constructor(TableName: string, Query: string, DB: SqliteDatabaseType) {
    this.Table = new Table(TableName, DB);
    this.query = Query;
    this.db = DB;
  }

  public Run(): any {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.run(...this.SortParameters());
  }

  public All(): any {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.all(...this.SortParameters());
  }

  public Get(): any {
    this.Validate();
    const stmt = this.db.prepare(this.query);
    return stmt.get(...this.SortParameters());
  }

  /**
   * Execute the query for multiple items in a transaction
   * @param items Array of parameter objects to execute
   * @returns Transaction result
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

  public Validate() {
    if (!this.ValidateQuery()) {
      throw new Error("Query is not valid.");
    }

    if (!this.ValidateParameters()) {
      throw new Error("Parameters are not valid.");
    }
  }

  private ValidateQuery(): boolean {
    return (
      this.query.split("").filter((char) => char === "?").length ===
      Object.keys(this.Parameters).length
    ) || (Object.keys(this.Parameters).length < 0 && Object.keys(this.Parameters).length <= 0);
  }

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

  private SortParameters(): QueryValues[] {
    const queryWords = this.query.split(" ");
    const sortedParameters: QueryValues[] = [];

    for (const word of queryWords) {
      if (this.Parameters[word.replace("(", "").replace(")", "")]) {
        sortedParameters.push(this.Parameters[word.replace("(", "").replace(")", "")]);
      }
    }

    return sortedParameters;
  }

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
