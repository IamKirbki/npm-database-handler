import Table from "./Table.js";
import { QueryCondition, QueryWhereParameters } from "@core/types/index.js";
import Record from "./Record.js";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";

/** Query class for executing custom SQL queries */
export default class Query {
  public readonly Table: Table;
  private readonly adapter: IDatabaseAdapter;
  private query: string = "";
  private _parameters: QueryCondition = {};

  public get Parameters(): QueryCondition {
    return this._parameters;
  }

  public set Parameters(value: QueryCondition) {
    this._parameters = Query.convertParamsToObject(value);
  }

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
  public async Run<Type>(): Promise<Type> {
    const stmt = await this.adapter.prepare(this.query);
    return await stmt.run(this.Parameters) as Type;
  }

  /** Execute a SELECT query and return all matching rows */
  public async All<Type>(): Promise<Record<Type>[]> {
    const stmt = await this.adapter.prepare(this.query);
    const results = await stmt.all(this.Parameters) as Type[];
    return results.map(res => new Record<Type>(res, this.adapter, this.Table));
  }

  public static convertParamsToObject(params: QueryCondition): QueryWhereParameters {
    const paramObject: QueryWhereParameters = {};
    if (Array.isArray(params)) {
      params.forEach(param => {
        paramObject[param.column] = param.value;
      });
    } else {
      Object.assign(paramObject, params);
    }
    
    return this.convertIdToString(paramObject);
  }

  public static convertIdToString(params: QueryWhereParameters): QueryWhereParameters {
    if (params.id && typeof params.id === 'number') {
      return { ...params, id: params.id.toString() };
    }

    return params;
  }

  /** Execute a SELECT query and return the first matching row */
  public async Get<Type>(): Promise<Record<Type> | undefined> {
    const stmt = await this.adapter.prepare(this.query);
    const results = await stmt.get(this.Parameters) as Type | undefined;
    return results ? new Record<Type>(results, this.adapter, this.Table) : undefined;
  }

  public async Transaction(paramList: QueryCondition[]): Promise<void> {
    const stmt = await this.adapter.prepare(this.query);
    const transactionFn = await this.adapter.transaction((paramsArray: QueryCondition[]) => {
      for (const params of paramsArray) {
        // Use runSync for better-sqlite3 transactions (must be synchronous)
        // For other adapters, this method should be implemented appropriately
        if (stmt.runSync) {
          stmt.runSync(params);
        } else {
          // Fallback: call run without await (may not work for all adapters)
          stmt.run(params);
        }
      }
    });

    transactionFn(paramList);
  }
}
