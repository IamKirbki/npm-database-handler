import { Database as SqliteDatabaseType } from "better-sqlite3";
import { inspect } from "util";

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
export default class Record {
    private _db: SqliteDatabaseType;
    private _values: object = {};
    private readonly _tableName: string = "";

    /**
     * Creates a Record instance (typically called internally by Table methods)
     * 
     * @param values - Object containing column names and their values
     * @param db - Database connection instance
     * @param tableName - Name of the table this record belongs to
     */
    constructor(values: object, db: SqliteDatabaseType, tableName: string) {
        this._values = values;
        this._db = db;
        this._tableName = tableName;
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
    public get values(): object {
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
    public Update<Type extends {id: number | string}>(newValues: object): void {
        const setClauses = Object.keys(newValues)
            .map(key => `${key} = @${key}`)
            .join(", ");

        const query = `UPDATE ${this._tableName} SET ${setClauses} WHERE id = @id;`;

        const stmt = this._db.prepare(query);
        stmt.run({ ...newValues, id: (this._values as Type).id });
        
        this._values = { ...this._values, ...newValues };
    }

    /**
     * Delete this record from the database
     * 
     * @template TEntity - Record type that must include an 'id' property (number or string)
     * @throws Error if the record doesn't have an 'id' field
     * 
     * @example
     * ```typescript
     * const user = table.Record({ where: { id: 1 } });
     * user?.Delete();
     * // Record is permanently deleted from the database
     * ```
     */
    // TODO Where clause with primary key other than 'id'
    public Delete<Type extends {id: number | string}>(): void {
        const query = `DELETE FROM ${this._tableName} WHERE id = @id;`;
        const stmt = this._db.prepare(query);
        stmt.run({ id: (this._values as Type).id });
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
    public toJSON(): object {
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
    [inspect.custom](): object {
        return this._values;
    }
}