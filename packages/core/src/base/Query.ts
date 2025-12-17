import Table from "./Table.js";
import { QueryCondition, QueryWhereParameters } from "@core/types/index.js";
import Record from "./Record.js";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";

/** Query class for executing custom SQL queries */
export default class Query {
  public readonly Table: Table;
  
  private readonly _adapter: IDatabaseAdapter;
  private _query: string = "";
  private _parameters: QueryCondition = {};

  public get Parameters(): QueryCondition {
    return this._parameters;
  }

  public set Parameters(value: QueryCondition) {
    this._parameters = Query.ConvertParamsToObject(value);
  }

  constructor(Table: Table, Query: string, adapter: IDatabaseAdapter) {
    this.Table = Table;
    this._query = Query;
    this._adapter = adapter;
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
  public async Run<Type>(): Promise<Type> {
    const stmt = await this._adapter.prepare(this._query);
    return await stmt.run(this.Parameters) as Type;
  }

  /** Execute a SELECT query and return all matching rows */
  public async All<Type>(): Promise<Record<Type>[]> {
    const stmt = await this._adapter.prepare(this._query);
    const results = await stmt.all(this.Parameters) as Type[];
    return results.map(res => new Record<Type>(res, this._adapter, this.Table));
  }

  public static ConvertParamsToObject(params: QueryCondition): QueryWhereParameters {
    const paramObject: QueryWhereParameters = {};
    if (Array.isArray(params)) {
      params.forEach(param => {
        paramObject[param.column] = param.value;
      });
    } else {
      Object.assign(paramObject, params);
    }
    
    return this.ConvertIdToString(paramObject);
  }

  public static ConvertIdToString(params: QueryWhereParameters): QueryWhereParameters {
    if (params.id && typeof params.id === 'number') {
      return { ...params, id: params.id.toString() };
    }

    return params;
  }

  /** Execute a SELECT query and return the first matching row */
  public async Get<Type>(): Promise<Record<Type> | undefined> {
    const stmt = await this._adapter.prepare(this._query);
    const results = await stmt.get(this.Parameters) as Type | undefined;
    return results ? new Record<Type>(results, this._adapter, this.Table) : undefined;
  }
}
