import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";
import {
    DefaultQueryOptions,
    QueryOptions,
    QueryParameters,
    ReadableTableColumnInfo,
    // Join,
    TableColumnInfo,
} from "./types/index";
import Query from "@core/Query";
import Record from "@core/Record";
import QueryStatementBuilder from "@core/helpers/QueryStatementBuilder";

/**
 * Table class for interacting with a specific database table
 * Provides methods for querying, inserting, and retrieving table metadata
 * 
 * @example
 * ```typescript
 * const users = db.Table('users');
 * 
 * // Get all records
 * const allUsers = users.Records();
 * 
 * // Get filtered records
 * const activeUsers = users.Records({ 
 *   where: { status: 'active' } 
 * });
 * 
 * // Insert a record
 * users.Insert({ name: 'John', email: 'john@example.com' });
 * ```
 */
export default class Table {
    private readonly name: string;
    private readonly adapter: IDatabaseAdapter;

    /**
     * Private constructor - use Table.create() instead
     * 
     * @param name - Name of the table
     * @param adapter - Database adapter instance
     */
    private constructor(name: string, adapter: IDatabaseAdapter) {
        this.name = name;
        this.adapter = adapter;
    }

    /**
     * Create a Table instance (async factory method)
     * 
     * @param name - Name of the table
     * @param adapter - Database adapter instance
     * @param skipValidation - Skip table existence validation (used when creating new tables)
     * @returns Table instance
     * @throws Error if the table does not exist in the database
     */
    public static async create(name: string, adapter: IDatabaseAdapter, skipValidation = false): Promise<Table> {
        const table = new Table(name, adapter);
        
        if (!skipValidation) {
            const columns = await table.TableColumnInformation();
            if (!columns.length) {
                throw new Error(
                    `Table "${name}" does not exist in the database.\nYou might want to use the CreateTable function.`
                );
            }
        }
        
        return table;
    }

    /**
     * Get the name of the table
     * 
     * @returns The table name
     */
    public get Name(): string {
        return this.name;
    }

    /**
     * Get raw column information from SQLite PRAGMA
     * 
     * @returns Array of column metadata from SQLite
     * 
     * @example
     * ```typescript
     * const columns = await table.TableColumnInformation();
     * // [{ cid: 0, name: 'id', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 1 }, ...]
     * ```
     */
    public async TableColumnInformation(): Promise<TableColumnInfo[]> {
        const query = new Query(this, `PRAGMA table_info(${this.name});`, this.adapter);
        const records = await query.All<TableColumnInfo>();
        return records.map(record => record.values);
    }

    /**
     * Get readable, formatted column information
     * 
     * @returns Array of formatted column metadata with readable properties
     * 
     * @example
     * ```typescript
     * const columns = await table.ReadableTableColumnInformation();
     * // [{ name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, defaultValue: null }, ...]
     * ```
     */
    public async ReadableTableColumnInformation(): Promise<ReadableTableColumnInfo[]> {
        const columns = await this.TableColumnInformation();
        return columns.map((col) => ({
            name: col.name,
            type: col.type,
            nullable: col.notnull === 0,
            isPrimaryKey: col.pk === 1,
            defaultValue: col.dflt_value,
        }));
    }

    public async Drop(): Promise<void> {
        const queryStr = `DROP TABLE IF EXISTS ${this.name};`;
        const query = new Query(this, queryStr, this.adapter);
        await query.Run();
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
    public async Records<Type>(
        options?: DefaultQueryOptions & QueryOptions
    ): Promise<Record<Type>[]> {
        const queryStr = QueryStatementBuilder.BuildSelect(this, {
            select: options?.select,
            where: options?.where,
            orderBy: options?.orderBy,
            limit: options?.limit,
            offset: options?.offset,
        });

        const query = new Query(this, queryStr, this.adapter);

        if (options?.where && Object.keys(options.where).length > 0)
            query.Parameters = options.where;

        const results: Record<Type>[] = await query.All();
        
        // Wrap each result in a Record object
        return results;
    }

    /**
     * Fetch a single record from the table
     * 
     * @param options - Query options for selecting a record
     * @param options.select - Columns to select (default: "*")
     * @param options.where - Filter conditions as key-value pairs
     * @param options.orderBy - SQL ORDER BY clause (e.g., "created_at DESC")
     * @returns Single Record instance or undefined if not found
     * 
     * @example
     * ```typescript
     * // Get record by ID
     * const user = table.Record({ where: { id: 1 } });
     * 
     * // Get most recent record
     * const latest = table.Record({ orderBy: 'created_at DESC' });
     * 
     * // Update the record
     * user?.update({ status: 'inactive' });
     * ```
     */
    public async Record<Type>(
        options?: DefaultQueryOptions & QueryOptions
    ): Promise<Record<Type> | undefined> {
        const results = await this.Records({
            select: options?.select,
            where: options?.where,
            orderBy: options?.orderBy,
            limit: 1
        });

        return results[0] as Record<Type> | undefined;
    }

    /**
     * Get the total count of records in the table
     * 
     * @returns Number of records in the table
     * 
     * @example
     * ```typescript
     * const totalUsers = table.RecordsCount;
     * console.log(`Total users: ${totalUsers}`);
     * ```
     */
    public async RecordsCount(): Promise<number> {
        const stmt = await this.adapter.prepare(`SELECT COUNT(*) as count FROM ${this.name};`);
        const count = await stmt.get({}) as { count: number };
        return count.count || 0;
    }

    /**
     * Insert one or multiple records into the table
     * Validates data types against table schema before insertion
     * 
     * @param values - Single object or array of objects to insert
     * @returns Insert result with lastInsertRowid and changes count
     * @throws Error if values is empty or contains no columns
     * @throws Error if validation fails (wrong types, missing required fields)
     * 
     * @example
     * ```typescript
     * // Insert single record
     * const result = table.Insert({ name: 'John', age: 30 });
     * console.log(`Inserted row ID: ${result.lastInsertRowid}`);
     * 
     * // Insert multiple records (uses transaction for atomicity)
     * table.Insert([
     *   { name: 'John', age: 30 },
     *   { name: 'Jane', age: 25 }
     * ]);
     * ```
     */
    public async Insert<Type>(values: QueryParameters): Promise<Record<Type> | undefined>{
        const columns = Object.keys(values);

        if (columns.length === 0) {
            throw new Error("Cannot insert record with no columns");
        }

        const queryStr = QueryStatementBuilder.BuildInsert(this, values);
        const query = new Query(this, queryStr, this.adapter);
        query.Parameters = values;
        
        const result = await query.Run<{ lastInsertRowid: number | bigint; changes: number }>();
        return this.Record({
            where: { id: result.lastInsertRowid }
        });
    }

    /**
     * Perform an INNER JOIN operation between this table and one or more other tables
     * 
     * Executes a SELECT query with INNER JOIN clause(s) to retrieve records from multiple tables.
     * Supports single joins, multiple joins, and nested joins for complex relational queries.
     * 
     * @template Type - Expected return type (must include id: number | string)
     * @param Joins - Single Join object or array of Join objects defining the join operations
     * @param options - Query options including select columns, orderBy, limit, offset
     * @returns Array of Record objects containing joined data
     * 
     * @example
     * ```typescript
     * // Simple INNER JOIN between users and orders
     * const usersTable = db.Table('users');
     * const ordersTable = db.Table('orders');
     * 
     * const results = usersTable.InnerJoin(
     *   { fromTable: ordersTable, on: { user_id: 'id' } },
     *   { select: 'users.name, orders.total' }
     * );
     * 
     * // Multiple INNER JOINs
     * const addressesTable = db.Table('addresses');
     * const results = usersTable.InnerJoin([
     *   { fromTable: ordersTable, on: { user_id: 'id' } },
     *   { fromTable: addressesTable, on: { address_id: 'id' } }
     * ]);
     * 
     * // Nested INNER JOIN (users -> orders -> products)
     * const productsTable = db.Table('products');
     * const results = usersTable.InnerJoin({
     *   fromTable: ordersTable,
     *   on: { user_id: 'id' },
     *   join: {
     *     fromTable: productsTable,
     *     on: { product_id: 'id' }
     *   }
     * });
     * 
     * // With query options
     * const results = usersTable.InnerJoin(
     *   { fromTable: ordersTable, on: { user_id: 'id' } },
     *   {
     *     select: 'users.*, COUNT(orders.id) as order_count',
     *     orderBy: 'users.created_at DESC',
     *     limit: 10
     *   }
     * );
     * ```
     */
    // public InnerJoin<Type extends { id: number | string }>(
    //     Joins: Join | Join[],
    //     options?: DefaultQueryOptions & QueryOptions,
    // ): Record<Type>[] {
    //     const queryString = QueryStatementBuilder.BuildJoin(this, Joins, options);
    //     const query = new Query(this, queryString, this.db);

    //     // Set parameters if WHERE clause is present
    //     if (options?.where) {
    //         query.Parameters = options.where;
    //     }

    //     return query.All();
    // }
}
