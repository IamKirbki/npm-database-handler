import { DefaultQueryOptions, QueryOptions, QueryParameters, Join } from "../types/index";
import Table from "Table";

/**
 * QueryStatementBuilder - Utility class for building SQL query strings
 * 
 * Provides static methods to construct SQL statements in a consistent, safe manner.
 * All methods use named parameters (@fieldName syntax) for better-sqlite3 compatibility.
 * 
 * Features:
 * - Consistent query building pattern using array concatenation
 * - Support for SELECT, INSERT, UPDATE, DELETE, and COUNT operations
 * - JOIN support with nested join capabilities
 * - WHERE clause building with AND conditions
 * - Query options (ORDER BY, LIMIT, OFFSET)
 * 
 * @example
 * ```typescript
 * // Build a SELECT query
 * const query = QueryStatementBuilder.BuildSelect(usersTable, {
 *   select: 'id, name, email',
 *   where: { status: 'active' },
 *   orderBy: 'created_at DESC',
 *   limit: 10
 * });
 * // Result: "SELECT id, name, email FROM users WHERE status = @status ORDER BY created_at DESC LIMIT 10"
 * 
 * // Build an INSERT query
 * const insertQuery = QueryStatementBuilder.BuildInsert(usersTable, {
 *   name: 'John',
 *   email: 'john@example.com'
 * });
 * // Result: "INSERT INTO users (name, email) VALUES (@name, @email)"
 * ```
 */
export default class QueryStatementBuilder {
    /**
     * Build a SELECT SQL statement with optional filtering, ordering, and pagination
     * 
     * @param table - The table to select from
     * @param options - Query options including select columns, where conditions, orderBy, limit, offset
     * @returns Complete SELECT SQL statement string
     * 
     * @example
     * ```typescript
     * // Select all columns
     * const query = QueryStatementBuilder.BuildSelect(usersTable);
     * // "SELECT * FROM users"
     * 
     * // Select specific columns with filtering
     * const query = QueryStatementBuilder.BuildSelect(usersTable, {
     *   select: 'id, name, email',
     *   where: { status: 'active', age: 25 },
     *   orderBy: 'created_at DESC',
     *   limit: 10,
     *   offset: 20
     * });
     * // "SELECT id, name, email FROM users WHERE status = @status AND age = @age ORDER BY created_at DESC LIMIT 10 OFFSET 20"
     * ```
     */
    public static BuildSelect(table: Table, options?: DefaultQueryOptions & QueryOptions): string {
        const queryParts: string[] = [];

        queryParts.push(`SELECT ${options?.select ?? "*"}`);
        queryParts.push(`FROM ${table.Name}`);

        queryParts.push(this.BuildWhere(options?.where));
        queryParts.push(this.BuildQueryOptions(options ?? {}));

        return queryParts.join(" ");
    }

    /**
     * Build an INSERT SQL statement with named parameter placeholders
     * 
     * @param table - The table to insert into
     * @param record - Object containing column names and their placeholder values
     * @returns Complete INSERT SQL statement string with @fieldName placeholders
     * 
     * @example
     * ```typescript
     * const query = QueryStatementBuilder.BuildInsert(usersTable, {
     *   name: 'John',
     *   email: 'john@example.com',
     *   age: 30
     * });
     * // "INSERT INTO users (name, email, age) VALUES (@name, @email, @age)"
     * 
     * // Note: The actual values will be bound separately using the Parameters object
     * ```
     */
    public static BuildInsert(table: Table, record: QueryParameters): string {
        const queryParts: string[] = [];
        const columns = Object.keys(record);
        const placeholders = columns.map(col => `@${col}`);

        queryParts.push(`INSERT INTO ${table.Name}`);
        queryParts.push(`(${columns.join(", ")})`);
        queryParts.push(`VALUES (${placeholders.join(", ")})`);

        return queryParts.join(" ");
    }

    /**
     * Build an UPDATE SQL statement with SET clause and WHERE conditions
     * 
     * @param table - The table to update
     * @param record - Object containing columns to update with their placeholder values
     * @param where - Object containing WHERE conditions for targeting specific rows
     * @returns Complete UPDATE SQL statement string with @fieldName placeholders
     * 
     * @example
     * ```typescript
     * const query = QueryStatementBuilder.BuildUpdate(
     *   usersTable,
     *   { name: 'John Doe', age: 31 },
     *   { id: 1 }
     * );
     * // "UPDATE users SET name = @name, age = @age WHERE id = @id"
     * 
     * // Multiple WHERE conditions
     * const query = QueryStatementBuilder.BuildUpdate(
     *   usersTable,
     *   { status: 'inactive' },
     *   { status: 'active', last_login: '2023-01-01' }
     * );
     * // "UPDATE users SET status = @status WHERE status = @status AND last_login = @last_login"
     * ```
     */
    public static BuildUpdate(table: Table, record: QueryParameters, where: QueryParameters): string {
        const queryParts: string[] = [];
        const setClauses = Object.keys(record).map(col => `${col} = @${col}`);

        queryParts.push(`UPDATE ${table.Name}`);
        queryParts.push(`SET ${setClauses.join(", ")}`);
        queryParts.push(this.BuildWhere(where));

        return queryParts.join(" ");
    }

    /**
     * Build a DELETE SQL statement with WHERE conditions
     * 
     * @param table - The table to delete from
     * @param where - Object containing WHERE conditions for targeting specific rows to delete
     * @returns Complete DELETE SQL statement string with @fieldName placeholders
     * 
     * @example
     * ```typescript
     * const query = QueryStatementBuilder.BuildDelete(usersTable, { id: 1 });
     * // "DELETE FROM users WHERE id = @id"
     * 
     * // Multiple WHERE conditions
     * const query = QueryStatementBuilder.BuildDelete(usersTable, {
     *   status: 'deleted',
     *   last_login: '2020-01-01'
     * });
     * // "DELETE FROM users WHERE status = @status AND last_login = @last_login"
     * ```
     */
    public static BuildDelete(table: Table, where: QueryParameters): string {
        const queryParts: string[] = [];

        queryParts.push(`DELETE FROM ${table.Name}`);
        queryParts.push(this.BuildWhere(where));

        return queryParts.join(" ");
    }

    /**
     * Build a COUNT SQL statement to count rows, optionally with WHERE conditions
     * 
     * @param table - The table to count rows from
     * @param where - Optional object containing WHERE conditions to filter counted rows
     * @returns Complete COUNT SQL statement string with @fieldName placeholders
     * 
     * @example
     * ```typescript
     * // Count all rows
     * const query = QueryStatementBuilder.BuildCount(usersTable);
     * // "SELECT COUNT(*) as count FROM users"
     * 
     * // Count with conditions
     * const query = QueryStatementBuilder.BuildCount(usersTable, {
     *   status: 'active',
     *   age: 25
     * });
     * // "SELECT COUNT(*) as count FROM users WHERE status = @status AND age = @age"
     * ```
     */
    public static BuildCount(table: Table, where?: QueryParameters): string {
        const queryParts: string[] = [];
        queryParts.push(`SELECT COUNT(*) as count FROM ${table.Name}`);
        queryParts.push(this.BuildWhere(where));

        return queryParts.join(" ");
    }

    /**
     * Build a WHERE clause from parameter conditions (helper method)
     * 
     * Joins multiple conditions with AND operator.
     * Returns empty string if no conditions are provided.
     * 
     * @param where - Optional object containing WHERE conditions
     * @returns WHERE clause string with @fieldName placeholders, or empty string if no conditions
     * 
     * @example
     * ```typescript
     * // Single condition
     * const whereClause = QueryStatementBuilder.BuildWhere({ id: 1 });
     * // "WHERE id = @id"
     * 
     * // Multiple conditions (joined with AND)
     * const whereClause = QueryStatementBuilder.BuildWhere({
     *   status: 'active',
     *   age: 25,
     *   role: 'admin'
     * });
     * // "WHERE status = @status AND age = @age AND role = @role"
     * 
     * // No conditions
     * const whereClause = QueryStatementBuilder.BuildWhere();
     * // ""
     * ```
     */
    public static BuildWhere(where?: QueryParameters): string {
        if (!where) return "";

        const queryParts: string[] = [];
        const whereClauses = Object.keys(where).map(col => `${col} = @${col}`);

        queryParts.push("WHERE");
        queryParts.push(whereClauses.join(" AND "));

        return queryParts.join(" ");
    }

    /**
     * Build a SELECT statement with JOIN operations (INNER, LEFT, RIGHT, FULL)
     * 
     * Supports single or multiple joins, including nested joins.
     * Combines the base SELECT with JOIN clauses and query options.
     * The join type (INNER, LEFT, RIGHT, FULL) is specified in each Join object.
     * 
     * @param fromTable - The primary table to select from
     * @param joins - Single Join object or array of Join objects defining the join operations
     * @param options - Query options including select columns, orderBy, limit, offset
     * @returns Complete SELECT statement with JOIN clauses
     * 
     * @example
     * ```typescript
     * // Single INNER JOIN
     * const query = QueryStatementBuilder.BuildJoin(
     *   usersTable,
     *   { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
     *   { select: 'users.*, orders.total' }
     * );
     * // "SELECT users.*, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id"
     * 
     * // Multiple joins with different types
     * const query = QueryStatementBuilder.BuildJoin(
     *   usersTable,
     *   [
     *     { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
     *     { fromTable: addressesTable, joinType: 'LEFT', on: { address_id: 'id' } }
     *   ],
     *   { orderBy: 'users.created_at DESC', limit: 10 }
     * );
     * 
     * // Nested JOIN
     * const query = QueryStatementBuilder.BuildJoin(
     *   usersTable,
     *   {
     *     fromTable: ordersTable,
     *     joinType: 'INNER',
     *     on: { user_id: 'id' },
     *     join: { fromTable: productsTable, joinType: 'INNER', on: { product_id: 'id' } }
     *   }
     * );
     * ```
     */
    public static BuildJoin(
        fromTable: Table,
        joins: Join | Join[],
        options?: DefaultQueryOptions & QueryOptions
    ) {
        const queryParts: string[] = [];
        queryParts.push(`SELECT ${options?.select ?? "*"}`);
        queryParts.push(`FROM ${fromTable.Name}`);
        queryParts.push(this.BuildJoinPart(fromTable, joins));
        queryParts.push(this.BuildWhere(options?.where));
        queryParts.push(this.BuildQueryOptions(options ?? {}));

        return queryParts.join(" ");
    }

    /**
     * Build JOIN clause(s) recursively (helper method)
     * 
     * Processes single or multiple join definitions and handles nested joins.
     * Each join includes the JOIN clause (INNER, LEFT, RIGHT, FULL) and ON conditions.
     * 
     * @param fromTable - The table being joined from (for ON clause context)
     * @param joins - Single Join object or array of Join objects
     * @returns JOIN clause(s) as a string
     * 
     * @example
     * ```typescript
     * // Single INNER JOIN
     * const joinClause = QueryStatementBuilder.BuildJoinPart(
     *   usersTable,
     *   { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } }
     * );
     * // "INNER JOIN orders ON users.id = orders.user_id"
     * 
     * // LEFT JOIN
     * const joinClause = QueryStatementBuilder.BuildJoinPart(
     *   usersTable,
     *   { fromTable: profilesTable, joinType: 'LEFT', on: { profile_id: 'id' } }
     * );
     * // "LEFT JOIN profiles ON users.id = profiles.profile_id"
     * 
     * // Nested join
     * const joinClause = QueryStatementBuilder.BuildJoinPart(
     *   usersTable,
     *   {
     *     fromTable: ordersTable,
     *     joinType: 'INNER',
     *     on: { user_id: 'id' },
     *     join: { fromTable: productsTable, joinType: 'INNER', on: { product_id: 'id' } }
     *   }
     * );
     * // "INNER JOIN orders ON users.id = orders.user_id INNER JOIN products ON orders.id = products.product_id"
     * ```
     */
    public static BuildJoinPart(
        fromTable: Table,
        joins: Join | Join[],
    ): string {
        const queryParts: string[] = [];
        const joinsArray = Array.isArray(joins) ? joins : [joins];

        let currentTable = fromTable;
        for (const join of joinsArray) {
            queryParts.push(`${join.joinType} JOIN ${join.fromTable.Name}`);
            queryParts.push(this.BuildJoinOnPart(currentTable, join.fromTable, join.on));
            currentTable = join.fromTable;
        }


        return queryParts.join(" ");
    }

    /**
     * Build ON clause for JOIN operations (helper method)
     * 
     * Creates ON conditions for join operations.
     * Compares the foreign key column in the joined table with the primary key in the source table.
     * Multiple conditions are joined with AND operator.
     * 
     * @param table - The source table (left side of the join)
     * @param joinTable - The table being joined (right side of the join)
     * @param on - QueryParameters object where key is the foreign key in joinTable and value is the primary key in table
     * @returns ON clause string for JOIN operations
     * 
     * @example
     * ```typescript
     * // Single ON condition
     * // Key: column in joinTable (orders), Value: column in table (users)
     * const onClause = QueryStatementBuilder.BuildJoinOnPart(
     *   usersTable,
     *   ordersTable,
     *   { user_id: 'id' }
     * );
     * // "ON users.id = orders.user_id"
     * 
     * // Multiple ON conditions
     * const onClause = QueryStatementBuilder.BuildJoinOnPart(
     *   usersTable,
     *   ordersTable,
     *   [{ user_id: 'id' }, { company_id: 'company_id' }]
     * );
     * // "ON users.id = orders.user_id AND users.company_id = orders.company_id"
     * ```
     */
    public static BuildJoinOnPart(
        table: Table,
        joinTable: Table,
        on: QueryParameters | QueryParameters[],
    ): string {
        const queryParts: string[] = [];
        const onArray = Array.isArray(on) ? on : [on];

        for (const onPart of onArray) {
            queryParts.push(`ON ${table.Name}.${Object.values(onPart)[0]} = ${joinTable.Name}.${Object.keys(onPart)[0]}`);
        }

        return queryParts.join(" AND ");
    }

    /**
     * Build query options clause (ORDER BY, LIMIT, OFFSET) (helper method)
     * 
     * Processes query options and builds the corresponding SQL clauses.
     * Returns empty string if no options are provided.
     * 
     * @param options - Object containing orderBy, limit, and/or offset options
     * @returns Query options clause as a string
     * 
     * @example
     * ```typescript
     * // All options
     * const optionsClause = QueryStatementBuilder.BuildQueryOptions({
     *   orderBy: 'created_at DESC',
     *   limit: 10,
     *   offset: 20
     * });
     * // "ORDER BY created_at DESC LIMIT 10 OFFSET 20"
     * 
     * // Just ordering
     * const optionsClause = QueryStatementBuilder.BuildQueryOptions({
     *   orderBy: 'name ASC'
     * });
     * // "ORDER BY name ASC"
     * 
     * // Pagination only
     * const optionsClause = QueryStatementBuilder.BuildQueryOptions({
     *   limit: 25,
     *   offset: 50
     * });
     * // "LIMIT 25 OFFSET 50"
     * ```
     */
    public static BuildQueryOptions(options: QueryOptions): string {
        const queryParts: string[] = [];
        if (options?.orderBy) {
            queryParts.push(`ORDER BY ${options.orderBy}`);
        }

        if (options?.limit) {
            queryParts.push(`LIMIT ${options.limit}`);

            if (options?.offset) {
                queryParts.push(`OFFSET ${options.offset}`);
            }
        }


        return queryParts.join(" ");
    }
}