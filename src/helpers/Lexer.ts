/**
 * SQL Components that can be parsed from a query:
 * 
 * ARCHITECTURE REFACTORING:
 * TODO: Split this Lexer into multiple parser classes (Option 1 approach):
 *       - Create src/helpers/parsers/ directory
 *       - Create SelectParser.ts for SELECT/DISTINCT parsing
 *       - Create FromParser.ts for FROM clause and table aliases
 *       - Create WhereParser.ts for WHERE conditions and operators
 *       - Create JoinParser.ts for all JOIN types and ON conditions
 *       - Create GroupByParser.ts for GROUP BY and HAVING
 *       - Create OrderByParser.ts for ORDER BY with ASC/DESC
 *       - Create LimitParser.ts for LIMIT and OFFSET
 *       - Create InsertParser.ts for INSERT and VALUES
 *       - Create UpdateParser.ts for UPDATE and SET
 *       - Create DeleteParser.ts for DELETE operations
 *       - Create DdlParser.ts for CREATE/DROP/ALTER operations
 *       - Create src/helpers/validators/ directory
 *       - Create ParameterValidator.ts for parameter validation
 *       - Create QueryValidator.ts for general query validation
 *       - Update main Lexer.ts to orchestrate these parsers
 * 
 * BASIC QUERY STRUCTURE:
 * - SELECT clause (columns, expressions)
 * - FROM clause (table name)
 * - WHERE clause (filter conditions)
 * - JOIN clauses (table joins)
 * - ON clause (join conditions)
 * - GROUP BY clause -> TODO: Implement in GroupByParser.ts
 * - HAVING clause -> TODO: Implement in GroupByParser.ts
 * - ORDER BY clause -> TODO: Move to OrderByParser.ts
 * - LIMIT clause -> TODO: Move to LimitParser.ts
 * - OFFSET clause -> TODO: Implement in LimitParser.ts
 * 
 * INSERT/UPDATE/DELETE:
 * - INSERT INTO (table, columns) -> TODO: Move to InsertParser.ts
 * - VALUES clause -> TODO: Move to InsertParser.ts
 * - SET clause (for UPDATE) -> TODO: Move to UpdateParser.ts
 * - DELETE FROM -> TODO: Move to DeleteParser.ts
 * 
 * ADVANCED FEATURES (implement in SelectParser.ts):
 * DISTINCT keyword
 * Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
 * TODO: Subqueries (in SELECT, FROM, WHERE)
 * TODO: UNION/INTERSECT/EXCEPT
 * TODO: Window functions (OVER, PARTITION BY)
 * TODO: Common Table Expressions (WITH/CTE)
 * 
 * JOIN TYPES (implement in JoinParser.ts):
 * - INNER JOIN (currently supported)
 * LEFT JOIN / LEFT OUTER JOIN
 * RIGHT JOIN / RIGHT OUTER JOIN
 * FULL JOIN / FULL OUTER JOIN
 * CROSS JOIN
 * NATURAL JOIN
 * SELF JOIN
 * Multiple JOINs in same query
 * 
 * CONDITIONAL OPERATORS (implement in WhereParser.ts):
 * - AND (currently supported in WHERE/ON)
 * TODO: OR (in WHERE/ON/HAVING)
 * TODO: NOT
 * TODO: IN / NOT IN
 * TODO: BETWEEN / NOT BETWEEN
 * TODO: LIKE / NOT LIKE
 * TODO: IS NULL / IS NOT NULL
 * TODO: EXISTS / NOT EXISTS
 * 
 * FUNCTIONS (create FunctionParser.ts or add to relevant parsers):
 * TODO: String functions (UPPER, LOWER, LENGTH, SUBSTR, TRIM, etc.)
 * TODO: Date/Time functions (DATE, DATETIME, STRFTIME, NOW, etc.)
 * TODO: Numeric functions (ROUND, ABS, CEIL, FLOOR, etc.)
 * TODO: Conditional functions (CASE WHEN, COALESCE, NULLIF, IFNULL)
 * TODO: Type conversion (CAST, TYPEOF)
 * 
 * GROUPING & AGGREGATION (implement in GroupByParser.ts):
 * TODO: GROUP BY (single column)
 * TODO: GROUP BY (multiple columns)
 * TODO: HAVING clause
 * TODO: ROLLUP
 * TODO: CUBE
 * 
 * SORTING & PAGINATION (implement in OrderByParser.ts and LimitParser.ts):
 * - ORDER BY (single column, currently supported) -> TODO: Move to OrderByParser.ts
 * TODO: ORDER BY (multiple columns)
 * TODO: ORDER BY with ASC/DESC per column
 * TODO: ORDER BY with NULLS FIRST/LAST
 * - LIMIT (currently supported) -> TODO: Move to LimitParser.ts
 * TODO: OFFSET (add to LimitParser.ts)
 * TODO: FETCH FIRST/NEXT
 * 
 * ALIASES (implement in FromParser.ts and SelectParser.ts):
 * - Column aliases with AS (partially supported)
 * TODO: Table aliases (AS / without AS) -> FromParser.ts
 * TODO: Subquery aliases -> FromParser.ts
 * 
 * DATA MODIFICATION (implement in InsertParser.ts):
 * - Single row INSERT (currently supported)
 * TODO: Multiple row INSERT
 * TODO: INSERT with SELECT
 * TODO: INSERT OR REPLACE/IGNORE
 * TODO: ON CONFLICT clause
 * TODO: RETURNING clause
 * 
 * TABLE OPERATIONS (implement in DdlParser.ts):
 * - CREATE TABLE (basic, currently supported)
 * - DROP TABLE (currently supported)
 * TODO: ALTER TABLE (ADD/DROP/MODIFY COLUMN)
 * TODO: CREATE INDEX
 * TODO: DROP INDEX
 * TODO: CREATE VIEW
 * TODO: DROP VIEW
 * TODO: TRUNCATE TABLE
 * 
 * CONSTRAINTS (implement in DdlParser.ts):
 * TODO: PRIMARY KEY
 * TODO: FOREIGN KEY
 * TODO: UNIQUE
 * TODO: CHECK
 * TODO: DEFAULT
 * TODO: NOT NULL
 * TODO: AUTO INCREMENT
 * 
 * TRANSACTIONS (create TransactionParser.ts):
 * TODO: BEGIN/START TRANSACTION
 * TODO: COMMIT
 * TODO: ROLLBACK
 * TODO: SAVEPOINT
 * 
 * OTHER (implement in relevant parsers):
 * TODO: Comments (-- and /* *\/) -> QueryValidator.ts
 * TODO: Literal values (strings, numbers, dates) -> Create LiteralParser.ts
 * TODO: Expression parsing -> Create ExpressionParser.ts
 * TODO: Parentheses for grouping conditions -> WhereParser.ts
 * TODO: Wildcards in column selection -> SelectParser.ts
 * TODO: Table-qualified column names (table.column) -> SelectParser.ts
 * TODO: Schema-qualified names (schema.table.column) -> FromParser.ts
 */

import { FromValues, JoinValues, QueryType, SelectValues, WhereValues } from "types/index";
import FromParser from "./parsers/FromParser";
import SelectParser from "./parsers/SelectParser";
import WhereParser from "./parsers/WhereParser";
import JoinParser from "./parsers/JoinParser";

export default class Lexer {
    private _detectedQueryType?: QueryType;
    public get DetectedQueryType() {
        return this._detectedQueryType;
    }

    private readonly _queryTypes: Record<QueryType, () => void> = {
        'SELECT': this.ParseSelectQuery.bind(this),
        'INSERT': this.ParseSelectQuery.bind(this), 
        'UPDATE': this.ParseSelectQuery.bind(this),
        'DELETE': this.ParseSelectQuery.bind(this),
        'CREATE': this.ParseSelectQuery.bind(this),
        'DROP': this.ParseSelectQuery.bind(this),
        'ALTER': this.ParseSelectQuery.bind(this)
    };

    public readonly query: string;

    constructor(query: string) {
        this.query = query;

        this._detectedQueryType = Object.keys(this._queryTypes).find(type => {
            const regex = new RegExp(`^\\s*${type}\\b`, 'i');
            return regex.test(this.query);
        }) as QueryType | undefined;

        if (this._detectedQueryType) {
            this._queryTypes[this._detectedQueryType]();
        }
    }

    private ParseSelectQuery(): void {
        this._select();
        this._from();
        this._where();
        this._join();
    }

    private _selectValues?: SelectValues[];
    public get SelectValues(): SelectValues[] | undefined {
        return this._selectValues;
    }

    private _select(): void {
        const selectParser = new SelectParser(this.query);
        this._selectValues = selectParser.SelectValues;
    }

    private _fromValues?: FromValues[];
    public get FromValues(): FromValues[] | undefined {
        return this._fromValues;
    }

    private _from(): void {
        const fromParser = new FromParser(this.query);
        this._fromValues = fromParser.FromValues;
    }

    private _whereValues?: WhereValues[];
    public get WhereValues(): WhereValues[] | undefined {
        return this._whereValues;
    }

    private _where(): void {
        const whereParser = new WhereParser(this.query);
        this._whereValues = whereParser.WhereValues;
    }

    private _joinValues?: JoinValues[];
    public get JoinValues(): JoinValues[] | undefined {
        return this._joinValues;
    }

    private _join(): void {
        const joinParser = new JoinParser(this.query);
        this._joinValues = joinParser.JoinValues;
    }
}