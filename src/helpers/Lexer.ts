/**
 * SQL Components that can be parsed from a query:
 * 
 * BASIC QUERY STRUCTURE:
 * - SELECT clause (columns, expressions)
 * - FROM clause (table name)
 * - WHERE clause (filter conditions)
 * - JOIN clauses (table joins)
 * - ON clause (join conditions)
 * - GROUP BY clause
 * - HAVING clause
 * - ORDER BY clause
 * - LIMIT clause
 * - OFFSET clause
 * 
 * INSERT/UPDATE/DELETE:
 * - INSERT INTO (table, columns)
 * - VALUES clause
 * - SET clause (for UPDATE)
 * - DELETE FROM
 * 
 * ADVANCED FEATURES:
 * TODO DISTINCT keyword
 * TODO Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
 * TODO Subqueries (in SELECT, FROM, WHERE)
 * TODO UNION/INTERSECT/EXCEPT
 * TODO Window functions (OVER, PARTITION BY)
 * TODO Common Table Expressions (WITH/CTE)
 * 
 * JOIN TYPES:
 * - INNER JOIN (currently supported)
 * TODO LEFT JOIN / LEFT OUTER JOIN
 * TODO RIGHT JOIN / RIGHT OUTER JOIN
 * TODO FULL JOIN / FULL OUTER JOIN
 * TODO CROSS JOIN
 * TODO NATURAL JOIN
 * TODO SELF JOIN
 * TODO Multiple JOINs in same query
 * 
 * CONDITIONAL OPERATORS:
 * - AND (currently supported in WHERE/ON)
 * TODO OR (in WHERE/ON/HAVING)
 * TODO NOT
 * TODO IN / NOT IN
 * TODO BETWEEN / NOT BETWEEN
 * TODO LIKE / NOT LIKE
 * TODO IS NULL / IS NOT NULL
 * TODO EXISTS / NOT EXISTS
 * 
 * FUNCTIONS:
 * TODO String functions (UPPER, LOWER, LENGTH, SUBSTR, TRIM, etc.)
 * TODO Date/Time functions (DATE, DATETIME, STRFTIME, NOW, etc.)
 * TODO Numeric functions (ROUND, ABS, CEIL, FLOOR, etc.)
 * TODO Conditional functions (CASE WHEN, COALESCE, NULLIF, IFNULL)
 * TODO Type conversion (CAST, TYPEOF)
 * 
 * GROUPING & AGGREGATION:
 * TODO GROUP BY (single column)
 * TODO GROUP BY (multiple columns)
 * TODO HAVING clause
 * TODO ROLLUP
 * TODO CUBE
 * 
 * SORTING & PAGINATION:
 * - ORDER BY (single column, currently supported)
 * TODO ORDER BY (multiple columns)
 * TODO ORDER BY with ASC/DESC per column
 * TODO ORDER BY with NULLS FIRST/LAST
 * - LIMIT (currently supported)
 * TODO OFFSET
 * TODO FETCH FIRST/NEXT
 * 
 * ALIASES:
 * - Column aliases with AS (partially supported)
 * TODO Table aliases (AS / without AS)
 * TODO Subquery aliases
 * 
 * DATA MODIFICATION:
 * - Single row INSERT (currently supported)
 * TODO Multiple row INSERT
 * TODO INSERT with SELECT
 * TODO INSERT OR REPLACE/IGNORE
 * TODO ON CONFLICT clause
 * TODO RETURNING clause
 * 
 * TABLE OPERATIONS:
 * - CREATE TABLE (basic, currently supported)
 * - DROP TABLE (currently supported)
 * TODO ALTER TABLE (ADD/DROP/MODIFY COLUMN)
 * TODO CREATE INDEX
 * TODO DROP INDEX
 * TODO CREATE VIEW
 * TODO DROP VIEW
 * TODO TRUNCATE TABLE
 * 
 * CONSTRAINTS:
 * TODO PRIMARY KEY
 * TODO FOREIGN KEY
 * TODO UNIQUE
 * TODO CHECK
 * TODO DEFAULT
 * TODO NOT NULL
 * TODO AUTO INCREMENT
 * 
 * TRANSACTIONS:
 * TODO BEGIN/START TRANSACTION
 * TODO COMMIT
 * TODO ROLLBACK
 * TODO SAVEPOINT
 * 
 * OTHER:
 * TODO Comments (-- and /* *\/)
 * TODO Literal values (strings, numbers, dates)
 * TODO Expression parsing
 * TODO Parentheses for grouping conditions
 * TODO Wildcards in column selection
 * TODO Table-qualified column names (table.column)
 * TODO Schema-qualified names (schema.table.column)
 */

export default class Lexer {
    private queryParts?: {
        selector?: string[];
        table?: string;
        where?: string[];
        values?: string[];
        set?: string[];
        orderBy?: string;
        limit?: number;
        on?: string[];
    }

    constructor(public query: string) {
        const parts = query.trim().split(";");
        if (parts.length > 1 && parts[1].trim() !== "") {
            throw new Error("Only single statements are allowed. Multiple statements detected.");
        }
    }

    public get QueryParts() {
        {
            this.ValidateParameters([
                ...(this.GetWhere || []),
                ...(this.GetSet || [])
            ]);
            this.ValidateOnParameters(this.GetOn || []);
            this.ValidateValueParameters(this.GetValues || []);

            if (!this.queryParts) {
                this.queryParts = {
                    selector: this.GetSelector,
                    table: this.GetTable,
                    where: this.GetWhere,
                    values: this.GetValues,
                    set: this.GetSet,
                    orderBy: this.GetOrderBy,
                    limit: this.GetLimit,
                    on: this.GetOn
                };
            }

            return this.queryParts;
        }
    }

    private ValidateValueParameters(params: string[]) {
        params.forEach(param => {
            const value = param.trim();

            if (!value || !value.startsWith("@")) {
                throw new Error(`Invalid value format: ${param}. Expected format: @value`);
            }
        });
    }

    private ValidateOnParameters(params: string[]) {
        params.forEach(param => {
            const [key, value] = param.split("=").map(s => s.trim());

            if (!key || !value) {
                throw new Error(`Invalid parameter format: ${param}. Expected format: key = value`);
            } else if (!value.includes(key.split(".")[1])) {
                throw new Error(`Parameter value must reference the key: ${param}. Expected format: table.key = table.key`);
            }
        });
    }

    private ValidateParameters(params: string[]) {
        params.forEach(param => {
            const [key, value] = param.split("=").map(s => s.trim());

            if (!key || !value || !value.startsWith("@")) {
                throw new Error(`Invalid parameter format: ${param}. Expected format: key = @value`);
            } else if (!value.includes(key) && !value.includes(key.split(".")[1])) {
                throw new Error(`Parameter value must reference the key: ${param}. Expected format: key = @key`);
            }
        });
    }

    private get GetSelector(): string[] | undefined {
        let selectMatch = this.query.match(/select\s+(.+?)\s+from/i);
        if (selectMatch)
            return selectMatch[1].split(",").map(s => s.trim());

        selectMatch = this.query.match(/select\s+(.+?)(\s+where|\s+order\s+by|\s+limit|;|$)/i);
        if (selectMatch)
            return selectMatch[1].split(",").map(s => s.trim());

        return undefined;
    }

    private get GetTable(): string | undefined {
        const patterns = [
            /from\s+([^\s;]+)/i,
            /update\s+([^\s;]+)/i,
            /insert\s+into\s+([^\s;]+)/i,
            /delete\s+from\s+([^\s;]+)/i,
            /create\s+table\s+([^\s;]+)/i,
            /drop\s+table\s+if\s+exists\s+([^\s;]+)/i,
            /drop\s+table\s+([^\s;]+)/i
        ];

        let fromMatch: RegExpMatchArray | null = null;
        for (const pattern of patterns) {
            fromMatch = this.query.match(pattern);
            if (fromMatch) break;
        }


        if (fromMatch)
            return fromMatch[1].trim();
        else if (this.GetSelector)
            throw new Error("FROM clause is required.");

        return undefined;
    }

    private get GetWhere(): string[] | undefined {
        const whereMatch = this.query.match(/where\s+(.+?)(\s+order by|\s+limit|;|$)/i);
        if (whereMatch)
            return whereMatch[1].split("and").map(s => s.trim());

        return undefined;
    }

    private get GetValues(): string[] | undefined {
        const valuesMatch = this.query.match(/values\s*\((.+?)\)/i);
        if (valuesMatch)
            return valuesMatch[1].split(",").map(s => s.trim());

        return undefined;
    }

    private get GetSet(): string[] | undefined {
        const setMatch = this.query.match(/set\s+(.+?)(\s+where|;|$)/i);
        if (setMatch)
            return setMatch[1].split(",").map(s => s.trim());

        return undefined;
    }

    private get GetOrderBy(): string | undefined {
        const orderByMatch = this.query.match(/order by\s+([^\s;]+)/i);
        if (orderByMatch)
            return orderByMatch[1].trim();

        return undefined;
    }

    private get GetLimit(): number | undefined {
        const limitMatch = this.query.match(/limit\s+(\d+)/i);
        if (limitMatch)
            return parseInt(limitMatch[1], 10);

        return undefined;
    }

    private get GetOn(): string[] | undefined {
        const onMatch = this.query.match(/on\s+(.+?)(\s+where|;|$)/i);
        if (onMatch)
            return onMatch[1].split("and").map(s => s.trim());

        return undefined;
    }
}