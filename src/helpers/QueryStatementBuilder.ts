import { DefaultQueryOptions, QueryOptions, QueryParameters } from "types/query";
import Table from "Table";
import { Join } from "../../types/table";

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
        const queryParts: string[] = [];
        const columns = Object.keys(record);
        const placeholders = columns.map(col => `@${col}`);

        queryParts.push(`INSERT INTO ${table.Name}`);
        queryParts.push(`(${columns.join(", ")})`);
        queryParts.push(`VALUES (${placeholders.join(", ")})`);

        return queryParts.join(" ");
    }

    public static BuildUpdate(table: Table, record: QueryParameters, where: QueryParameters): string {
        const queryParts: string[] = [];
        const setClauses = Object.keys(record).map(col => `${col} = @${col}`);

        queryParts.push(`UPDATE ${table.Name}`);
        queryParts.push(`SET ${setClauses.join(", ")}`);
        queryParts.push(this.BuildWhere(where));

        return queryParts.join(" ");
    }

    public static BuildDelete(table: Table, where: QueryParameters): string {
        const queryParts: string[] = [];

        queryParts.push(`DELETE FROM ${table.Name}`);
        queryParts.push(this.BuildWhere(where));

        return queryParts.join(" ");
    }

    public static BuildCount(table: Table, where?: QueryParameters): string {
        const queryParts: string[] = [];
        queryParts.push(`SELECT COUNT(*) as count FROM ${table.Name}`);
        queryParts.push(this.BuildWhere(where));

        return queryParts.join(" ");
    }

    public static BuildWhere(where?: QueryParameters): string {
        if (!where) return "";

        const queryParts: string[] = [];
        const whereClauses = Object.keys(where).map(col => `${col} = @${col}`);

        queryParts.push("WHERE");
        queryParts.push(whereClauses.join(" AND "));

        return queryParts.join(" ");
    }

    public static BuildInnerJoinPart(
        fromTable: Table,
        joins: Join | Join[],
    ): string {
        const queryParts: string[] = [];
        const joinsArray = Array.isArray(joins) ? joins : [joins];

        for (const join of joinsArray) {
            queryParts.push(`INNER JOIN ${join.fromTable.Name}`);

            if (join.join)
                queryParts.push(this.BuildInnerJoinPart(join.fromTable, join.join));

            queryParts.push(this.BuildJoinOnPart(fromTable, join.on));
        }

        return queryParts.join(" ");
    }

    public static BuildJoinOnPart(
        table: Table,
        on: QueryParameters | QueryParameters[],
    ): string {
        const queryParts: string[] = [];
        const onArray = Array.isArray(on) ? on : [on];

        for (const onPart of onArray) {
            queryParts.push(`ON ${table.Name}.${onPart} = ${table.Name}.${onPart}`);
        }


        return queryParts.join(" AND ");
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