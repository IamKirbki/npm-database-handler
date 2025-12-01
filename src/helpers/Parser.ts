/**
 * SQL Components that can be parsed from a query:
 * 
 * ARCHITECTURE REFACTORING:
 * ✅ COMPLETED: Split this Lexer into multiple parser classes:
 *       ✅ Created src/helpers/parsers/ directory
 *       ✅ Created BaseParser.ts for common parser functionality
 *       ✅ Created SqlUtils.ts for shared SQL parsing utilities
 *       ✅ Created SelectParser.ts for SELECT/DISTINCT parsing
 *       ✅ Created FromParser.ts for FROM clause and table aliases
 *       ✅ Created WhereParser.ts for WHERE conditions and operators
 *       ✅ Created JoinParser.ts for all JOIN types and ON conditions
 *       ✅ Created GroupByParser.ts for GROUP BY and HAVING
 *       TODO: Create OrderByParser.ts for ORDER BY with ASC/DESC
 *       TODO: Create LimitParser.ts for LIMIT and OFFSET
 *       TODO: Create InsertParser.ts for INSERT and VALUES
 *       TODO: Create UpdateParser.ts for UPDATE and SET
 *       TODO: Create DeleteParser.ts for DELETE operations
 *       TODO: Create DdlParser.ts for CREATE/DROP/ALTER operations
 *       TODO: Create src/helpers/validators/ directory
 *       TODO: Create ParameterValidator.ts for parameter validation
 *       TODO: Create QueryValidator.ts for general query validation
 *       ✅ Updated main Lexer.ts to orchestrate these parsers
 * 
 * BASIC QUERY STRUCTURE:
 * ✅ SELECT clause (columns, expressions) - Implemented in SelectParser.ts
 * ✅ FROM clause (table name) - Implemented in FromParser.ts
 * ✅ WHERE clause (filter conditions) - Implemented in WhereParser.ts
 * ✅ JOIN clauses (table joins) - Implemented in JoinParser.ts
 * ✅ ON clause (join conditions) - Implemented in JoinParser.ts
 * ✅ GROUP BY clause - Implemented in GroupByParser.ts
 * ✅ HAVING clause - Implemented in GroupByParser.ts
 * TODO: ORDER BY clause -> TODO: Move to OrderByParser.ts
 * TODO: LIMIT clause -> TODO: Move to LimitParser.ts
 * TODO: OFFSET clause -> TODO: Implement in LimitParser.ts
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
 * JOIN TYPES (✅ implemented in JoinParser.ts):
 * ✅ INNER JOIN
 * ✅ LEFT JOIN / LEFT OUTER JOIN
 * ✅ RIGHT JOIN / RIGHT OUTER JOIN
 * ✅ FULL JOIN / FULL OUTER JOIN
 * ✅ CROSS JOIN
 * ✅ Multiple JOINs in same query
 * TODO: NATURAL JOIN
 * TODO: SELF JOIN
 * 
 * CONDITIONAL OPERATORS (✅ implemented in WhereParser.ts):
 * ✅ AND (in WHERE/ON/HAVING)
 * ✅ OR (in WHERE/ON/HAVING)
 * ✅ Comparison operators (=, !=, <>, <, <=, >, >=)
 * ✅ LIKE / NOT LIKE
 * ✅ IN / NOT IN
 * ✅ IS NULL / IS NOT NULL
 * TODO: NOT
 * TODO: BETWEEN / NOT BETWEEN
 * TODO: EXISTS / NOT EXISTS
 * 
 * FUNCTIONS (create FunctionParser.ts or add to relevant parsers):
 * TODO: String functions (UPPER, LOWER, LENGTH, SUBSTR, TRIM, etc.)
 * TODO: Date/Time functions (DATE, DATETIME, STRFTIME, NOW, etc.)
 * TODO: Numeric functions (ROUND, ABS, CEIL, FLOOR, etc.)
 * TODO: Conditional functions (CASE WHEN, COALESCE, NULLIF, IFNULL)
 * TODO: Type conversion (CAST, TYPEOF)
 * 
 * GROUPING & AGGREGATION (✅ implemented in GroupByParser.ts):
 * ✅ GROUP BY (single column)
 * ✅ GROUP BY (multiple columns)
 * ✅ HAVING clause
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

import { SelectValues, SubQueryValues } from "types/index";
import SelectParser from "./parsers/SelectParser";
import SubQueryParser from "./parsers/SubQueryParser";

export default class Parser {
    private readonly query: string;
    private subQueryValues?: SubQueryValues;

    constructor(sqlQuery: string) {
        this.query = sqlQuery.split('\n').map(line => line.trim()).join(' ').replace(/\s+/g, ' ').trim();
        const subQueryParser = new SubQueryParser(this.query);
        this.subQueryValues = subQueryParser.SubQueries;
    }

    public get SelectValues(): SelectValues[] | SelectValues[][] {
        if (this.query.trim().toLowerCase().startsWith('with')) {
            const selectParser = new SelectParser(this.query);
            return selectParser.SelectValues || [];
        }
        
        if(this.subQueryValues && this.subQueryValues.queries.length > 0) {
            const allSelectValues: SelectValues[][] = [];
            for(const subQuery of this.subQueryValues.queries) {
                const selectParser = new SelectParser(subQuery);
                if(selectParser.SelectValues) {
                    allSelectValues.push(selectParser.SelectValues);
                }
            }
            return allSelectValues;
        }
        
        const selectParser = new SelectParser(this.query);
        return selectParser.SelectValues || [];
    }
}