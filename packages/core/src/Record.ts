import { inspect } from "util";
import Table from "@core/Table";
import Query from "@core/Query";
import { QueryParameters } from "./types/query";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";

/**
 * Record class represents a single database row with methods for updates and deletion
 * Automatically returned by Table.Records() and Table.Record() methods
 * 
 * @example
 * ```typescript
 * const user = table.Record({ where: { id: 1 } });
 * 
 * // Access values
 * console.log(user?.values);
 * 
 * // Update the record
 * user?.Update({ name: 'John Doe', age: 31 });
 * 
 * // Delete the record
 * user?.Delete();
 * 
 * // JSON serialization works automatically
 * console.log(JSON.stringify(user)); // {"id": 1, "name": "John Doe", ...}
 * ```
 */
export default class Record<ColumnValuesType> {
    private readonly adapter: IDatabaseAdapter;
    private _values: ColumnValuesType = {} as ColumnValuesType;
    private readonly _table: Table;

    /**
     * Creates a Record instance (typically called internally by Table methods)
     * 
     * @param values - Object containing column names and their values
     * @param db - Database connection instance
     * @param tableName - Name of the table this record belongs to
     */
    constructor(values: ColumnValuesType, adapter: IDatabaseAdapter, table: Table) {
        this._values = values;
        this.adapter = adapter;
        this._table = table;
    }

    /**
     * Get the raw values object for this record
     * 
     * @returns Object containing all column values
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * console.log(user?.values); // { id: 1, name: 'John', email: 'john@example.com' }
     * ```
     */
    public get values(): ColumnValuesType {
        return this._values;
    };

    /**
     * Update this record in the database
     * Updates both the database and the local values
     * 
     * @template TEntity - Record type that must include an 'id' property (number or string)
     * @param newValues - Object with column names and new values to update
     * @throws Error if the record doesn't have an 'id' field
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * user?.Update({ name: 'Jane Doe', age: 28 });
     * // Database is updated and user.values reflects the changes
     * ```
     */
    public Update(newValues: object): void {
        const setClauses = Object.keys(newValues)
            .map(key => `${key} = @${key}`)
            .join(", ");

        // Use all current values as WHERE clause to identify the record
        const originalValues = this._values as object;
        const whereClauses = Object.keys(originalValues)
            .map(key => `${key} = @where_${key}`)
            .join(" AND ");

        const query = `UPDATE ${this._table.Name} SET ${setClauses} WHERE ${whereClauses};`;
        const _query = new Query(this._table, query, this.adapter);
        
        const params: QueryParameters = { ...newValues };
        Object.entries(originalValues).forEach(([key, value]) => {
            params[`where_${key}`] = value;
        });
        
        _query.Parameters = params;
        _query.Run();

        this._values = { ...this._values, ...newValues };
    }

    /**
     * Delete this record from the database
     * Uses all current field values as WHERE clause conditions
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * user?.Delete();
     * // Record is permanently deleted from the database
     * ```
     */
    public Delete(): void {
        const whereClauses = Object.keys(this._values as object)
            .map(key => `${key} = @${key}`)
            .join(" AND ");
            
        const _query = new Query(this._table, `DELETE FROM ${this._table.Name} WHERE ${whereClauses};`, this.adapter);
        _query.Parameters = { ...this._values as object };
        _query.Run();
    }

    /**
     * Returns the values object when JSON.stringify() is called
     * Allows seamless JSON serialization of Record objects
     * 
     * @returns The values object
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * console.log(JSON.stringify(user)); 
     * // Output: {"id":1,"name":"John","email":"john@example.com"}
     * ```
     */
    public toJSON(): ColumnValuesType {
        return this._values;
    }

    /**
     * Returns a formatted string representation of the record
     * 
     * @returns Pretty-printed JSON string of the values
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * console.log(user?.toString());
     * // Output:
     * // {
     * //   "id": 1,
     * //   "name": "John",
     * //   "email": "john@example.com"
     * // }
     * ```
     */
    public toString(): string {
        return JSON.stringify(this._values, null, 2);
    }

    /**
     * Custom inspect method for console.log() and Node.js REPL
     * Makes Record objects display their values directly instead of the class structure
     * 
     * @returns The values object for display
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * console.log(user);
     * // Output: { id: 1, name: 'John', email: 'john@example.com' }
     * // Instead of: Record { _db: ..., _values: {...}, _tableName: '...' }
     * ```
     */
    [inspect.custom](): ColumnValuesType {
        return this._values;
    }
}