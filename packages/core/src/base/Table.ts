import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";
import {
    DefaultQueryOptions,
    Join,
    QueryOptions,
    ReadableTableColumnInfo,
    // Join,
    TableColumnInfo,
    QueryValues,
    columnType,
} from "@core/types/index.js";
import Query from "@core/base/Query.js";
import Record from "@core/base/Record.js";
import QueryStatementBuilder from "@core/helpers/QueryStatementBuilder.js";
import Container from "@core/Container.js";

/** Table class for interacting with a database table */
export default class Table {
    private readonly name: string;
    private readonly adapter: IDatabaseAdapter = Container.getInstance().getAdapter();

    /** Private constructor - use Table.create() */
    constructor(name: string) {
        this.name = name;
    }

    /** Get the table name */
    public get Name(): string {
        return this.name;
    }

    /** Get raw column information */
    public async TableColumnInformation(): Promise<TableColumnInfo[]> {
        return this.adapter.tableColumnInformation(this.name);
    }

    /** Get readable, formatted column information */
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
        const queryStr = `DROP TABLE IF EXISTS "${this.name}";`;
        const query = new Query(this, queryStr, this.adapter);
        await query.Run();
    }

    /** Fetch records with optional filtering, ordering, and pagination */
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

    /** Fetch a single record from the table */
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

    /** Get the total count of records */
    public async RecordsCount(): Promise<number> {
        const stmt = await this.adapter.prepare(`SELECT COUNT(*) as count FROM "${this.name}";`);
        const count = await stmt.get({}) as { count: string };
        return parseInt(count.count) || 0;
    }

    /** Insert a record into the table */
    public async Insert<Type>(values: columnType): Promise<Record<Type> | undefined>{
        const columns = Object.keys(values);

        if (columns.length === 0) {
            throw new Error("Cannot insert record with no columns");
        }

        const queryStr = QueryStatementBuilder.BuildInsert(this, values);
        const query = new Query(this, queryStr, this.adapter);
        query.Parameters = values;
        
        const result = await query.Run<{ lastInsertRowid: number | bigint; changes: number }>();
        
        let recordId: QueryValues;

        // For PostgreSQL compatibility: use 'id' from values if lastInsertRowid is undefined
        if(Array.isArray(values)){
            recordId = result?.lastInsertRowid ?? values.map(v => v.column === 'id' ? v.value : undefined);
        } else{
            recordId = result?.lastInsertRowid ?? values.id;
        }
        
        if (recordId === undefined) {
            return undefined;
        }
        
        return this.Record({
            where: { id: recordId }
        });
    }

    /** Perform JOIN operations with other tables */
    public async Join<Type>(
        Joins: Join | Join[],
        options?: DefaultQueryOptions & QueryOptions,
    ): Promise<Record<Type>[]> {
        const queryString = QueryStatementBuilder.BuildJoin(this, Joins, options);
        const query = new Query(this, queryString, this.adapter);

        // Set parameters if WHERE clause is present
        if (options?.where) {
            query.Parameters = options.where;
        }

        return await query.All();
    }
}
