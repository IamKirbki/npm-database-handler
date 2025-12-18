import {
    DefaultQueryOptions,
    Join,
    QueryOptions,
    ReadableTableColumnInfo,
    TableColumnInfo,
    columnType,
} from "@core/types/index.js";
import QueryStatementBuilder from "@core/helpers/QueryStatementBuilder.js";
import { Record, Query } from "@core/index.js";

/** Table class for interacting with a database table */
export default class Table {
    private readonly _name: string;

    /** Private constructor - use Table.create() */
    constructor(name: string) {
        this._name = name;
    }

    /** Get the table name */
    public get Name(): string {
        return this._name;
    }

    /** Get raw column information */
    public async TableColumnInformation(): Promise<TableColumnInfo[]> {
        return Query.tableColumnInformation(this._name);
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
        const queryStr = `DROP TABLE IF EXISTS "${this._name}";`;
        const query = new Query(this._name, queryStr);
        await query.Run();
    }

    /** Fetch records with optional filtering, ordering, and pagination */
    public async Records<Type extends columnType>(
        options?: DefaultQueryOptions & QueryOptions
    ): Promise<Record<Type>[]> {
        const queryStr = QueryStatementBuilder.BuildSelect(this._name, {
            select: options?.select,
            where: options?.where,
            orderBy: options?.orderBy,
            limit: options?.limit,
            offset: options?.offset,
        });

        const query = new Query(this._name, queryStr);
        
        if (options?.where && Object.keys(options.where).length > 0)
            query.Parameters = options.where;

        const results: Record<Type>[] = await query.All();
        return results;
    }

    /** Fetch a single record from the table */
    public async Record<Type extends columnType>(
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
        const query = new Query(this._name, `SELECT COUNT(*) as count FROM "${this._name}";`);
        const count = await query.Count();
        return count || 0;
    }

    /** Insert a record into the table */
    public async Insert<Type extends columnType>(values: Type): Promise<Record<Type> | undefined>{
        const record = new Record<Type>(values, this._name);
        await record.Insert();
        return record;
    }

    /** Perform JOIN operations with other tables */
    public async Join<Type extends columnType>(
        Joins: Join | Join[],
        options?: DefaultQueryOptions & QueryOptions,
    ): Promise<Record<Type>[]> {
        const queryString = QueryStatementBuilder.BuildJoin(this._name, Joins, options);
        const query = new Query(this._name, queryString);

        // Set parameters if WHERE clause is present
        if (options?.where) {
            query.Parameters = options.where;
        }

        return await query.All();
    }
}
