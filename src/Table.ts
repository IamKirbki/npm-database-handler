import { Database as SqliteDatabaseType } from "better-sqlite3";
import {
    QueryParameters,
    ReadableTableColumnInfo,
    TableColumnInfo,
} from "../types/index";
import Query from "./Query";

export default class Table {
    private readonly name: string;
    private readonly db: SqliteDatabaseType;

    constructor(name: string, db: SqliteDatabaseType) {
        this.name = name;
        this.db = db;

        if (!this.TableColumnInformation.length) {
            throw new Error(
                `Table "${name}" does not exist in the database.\nYou might want to use the CreateTable function.`
            );
        }
    }

    public get Name(): string {
        return this.name;
    }

    public get TableColumnInformation(): TableColumnInfo[] {
        return this.db
            .prepare(`PRAGMA table_info(${this.name});`)
            .all() as TableColumnInfo[];
    }

    public get ReadableTableColumnInformation(): ReadableTableColumnInfo[] {
        return this.TableColumnInformation.map((col) => ({
            name: col.name,
            type: col.type,
            nullable: col.notnull === 0,
            isPrimaryKey: col.pk === 1,
            defaultValue: col.dflt_value,
        }));
    }

    /**
     * Fetch records from the table with optional filtering, ordering, and pagination
     * @param options Query options for selecting records
     * @returns Array of records matching the criteria
     *
     * @example
     * // Get all records
     * table.Records();
     *
     * @example
     * // Get specific columns with filters
     * table.Records({
     *   select: 'id, name',
     *   where: { status: 'active', age: 25 }
     * });
     *
     * @example
     * // With ordering and pagination
     * table.Records({
     *   orderBy: 'created_at DESC',
     *   limit: 10,
     *   offset: 20
     * });
     */
    public Records(options?: {
        select?: string;
        where?: QueryParameters;
        orderBy?: string;
        limit?: number;
        offset?: number;
    }): any[] {
        const select = options?.select || "*";
        const queryParts: string[] = [`SELECT ${select} FROM ${this.name}`];

        // Build WHERE clause with ? placeholders
        if (options?.where && Object.keys(options.where).length > 0) {
            const whereConditions = Object.keys(options.where).map(() => "?");
            queryParts.push(`WHERE ${whereConditions.join(" AND ")}`);
        }

        if (options?.orderBy) {
            queryParts.push(`ORDER BY ${options.orderBy}`);
        }

        if (options?.limit !== undefined) {
            queryParts.push(`LIMIT ${options.limit}`);
        }

        if (options?.offset !== undefined) {
            queryParts.push(`OFFSET ${options.offset}`);
        }

        const queryStr = queryParts.join(" ");

        if (!options?.where || Object.keys(options.where).length === 0) {
            const query = new Query(this.name, queryStr, this.db);
            return query.All();
        }

        const query = new Query(this.name, queryStr, this.db);
        query.Parameters = options.where;

        return query.All();
    }

    /**
     * Fetch a single record from the table
     * @param options Query options (same as Records but returns first match)
     * @returns Single record or undefined if not found
     */
    public Record(options?: {
        select?: string;
        where?: QueryParameters;
        orderBy?: string;
    }): any | undefined {
        return this.Records({
            select: options?.select,
            where: options?.where,
            orderBy: options?.orderBy,
            limit: 1
        })
    }

    public get RecordsCount(): number {
        return this.db
            .prepare(`SELECT COUNT(*) as count FROM ${this.name};`)
            .get() as number;
    }

    /**
     * Insert one or multiple records into the table
     * @param values Single object or array of objects to insert
     * @returns Insert result with lastInsertRowid and changes count
     * 
     * @example
     * // Insert single record
     * table.Insert({ name: 'John', age: 30 });
     * 
     * @example
     * // Insert multiple records
     * table.Insert([
     *   { name: 'John', age: 30 },
     *   { name: 'Jane', age: 25 }
     * ]);
     */
    public Insert(values: QueryParameters | QueryParameters[]) {
        const isMultiple = Array.isArray(values);
        const records: QueryParameters[] = isMultiple ? values : [values];

        if (records.length === 0) {
            throw new Error("Cannot insert empty array");
        }

        // Get columns from first record
        const columns = Object.keys(records[0]);

        if (columns.length === 0) {
            throw new Error("Cannot insert record with no columns");
        }

        // Build INSERT query with ? placeholders
        const queryParts: string[] = [`INSERT INTO ${this.name}`];
        queryParts.push(`(${columns.join(", ")})`);
        queryParts.push("VALUES");
        queryParts.push(`(${columns.map(() => "?").join(", ")})`);

        const queryStr = queryParts.join(" ");

        // Use transaction for multiple records, direct run for single
        if (isMultiple && records.length > 1) {
            const query = new Query(this.name, queryStr, this.db);
            return query.Transaction(records);
        } else {
            // Single insert
            const query = new Query(this.name, queryStr, this.db);
            query.Parameters = records[0];
            return query.Run();
        }
    }
}
