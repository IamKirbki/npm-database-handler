import { inspect } from "util";
import Table from "./Table.js";
import Query from "./Query.js";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";
import { ModelWithTimestamps, QueryCondition } from "@core/types/index.js";

/** Record class represents a single database row */
export default class Record<ColumnValuesType> {
    private readonly _adapter: IDatabaseAdapter;
    private _values: ColumnValuesType = {} as ColumnValuesType;
    private readonly _table: Table;

    constructor(values: ColumnValuesType, adapter: IDatabaseAdapter, table: Table) {
        this._values = values;
        this._adapter = adapter;
        this._table = table;
    }

    /** Get the raw values object for this record */
    public get values(): ColumnValuesType {
        return this._values;
    };

    /** Update this record in the database */
    public async Update(newValues: object): Promise<void> {
        const setClauses = Object.keys(newValues)
            .map(key => `${key} = @${key}`)
            .join(", ");

        const originalValues = this._values as object;
        if ((originalValues as object & ModelWithTimestamps).updated_at !== undefined) {
            (newValues as object & ModelWithTimestamps).updated_at = new Date().toISOString();
        }

        const whereClauses = Object.keys(originalValues)
            .map(key => `${key} = @where_${key}`)
            .join(" AND ");

        const query = `UPDATE "${this._table.Name}" SET ${setClauses} WHERE ${whereClauses};`;
        const _query = new Query(this._table, query, this._adapter);

        const params: QueryCondition = { ...newValues };
        Object.entries(originalValues).forEach(([key, value]) => {
            params[`where_${key}`] = value;
        });

        _query.Parameters = params;
        await _query.Run();

        this._values = { ...this._values, ...newValues };
    }

    /** Delete this record from the database */
    public async Delete(): Promise<void> {
        const whereClauses = Object.keys(this._values as object)
            .map(key => `${key} = @${key}`)
            .join(" AND ");

        const _query = new Query(this._table, `DELETE FROM "${this._table.Name}" WHERE ${whereClauses};`, this._adapter);
        _query.Parameters = { ...this._values as object };
        await _query.Run();
    }

    /** Returns the values object for JSON.stringify() */
    public toJSON(): ColumnValuesType {
        return this._values;
    }

    /** Convert record to pretty-printed JSON string */
    public toString(): string {
        return JSON.stringify(this._values, null, 2);
    }

    /** Custom inspect for console.log() */
    [inspect.custom](): ColumnValuesType {
        return this._values;
    }
}