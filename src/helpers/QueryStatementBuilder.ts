import { DefaultQueryOptions, QueryOptions, QueryParameters } from "types/query";
import Table from "Table";

export default class QueryStatementBuilder {
    public static BuildSelect(table: Table, options?: DefaultQueryOptions & QueryOptions): string {
        const queryParts: string[] = [];

        queryParts.push(`SELECT ${options?.select ?? "*"}`);
        queryParts.push(`FROM ${table.Name}`);

        queryParts.push(this.BuildWhere(options?.where));
        queryParts.push(this.BuildQueryOptions(options ?? {}));

        return queryParts.join(" ");
    }

    public static BuildInsert(table: Table, record: QueryParameters): string {
        const columns = Object.keys(record);
        const placeholders = columns.map(col => `@${col}`);
        const query = `INSERT INTO ${table.Name} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
        return query;
    }

    public static BuildUpdate(table: Table, record: QueryParameters, where: QueryParameters): string {
        const setClauses = Object.keys(record).map(col => `${col} = @${col}`);
        const query = `UPDATE ${table.Name} SET ${setClauses.join(", ")} ${this.BuildWhere(where)}`;
        return query;
    }

    public static BuildDelete(table: Table, where: QueryParameters): string {
        const query = `DELETE FROM ${table.Name} WHERE ${this.BuildWhere(where)}`;
        return query;
    }

    public static BuildWhere(where?: QueryParameters): string {
        if (!where) return "";
        const whereClauses = Object.keys(where).map(col => `${col} = @${col}`);
        const query = `WHERE ${whereClauses.join(" AND ")}`;
        return query;
    }

    public static BuildQueryOptions(options: QueryOptions): string {
        const queryParts: string[] = [];
        if (options?.orderBy) {
            queryParts.push(`ORDER BY ${options.orderBy}`);
        }

        if (options?.limit) {
            queryParts.push(`LIMIT ${options.limit}`);
        }

        if (options?.offset) {
            queryParts.push(`OFFSET ${options.offset}`);
        }

        return queryParts.join(" ");
    }
}