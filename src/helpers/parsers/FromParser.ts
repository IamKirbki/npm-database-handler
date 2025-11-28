import { FromValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Parser for SQL FROM clause components.
 * 
 * CURRENT FEATURES:
 * ✅ Basic table references
 * ✅ Table aliases (with and without AS keyword)
 * ✅ Schema-qualified table names
 * 
 * TODO FEATURES:
 * 
 * - Subquery aliases
 *   Example: "SELECT * FROM (SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id) as user_stats"
 *   Explanation: Parse subqueries used as table sources with required aliases
 * 
 * - Table-valued functions
 *   Example: "SELECT * FROM json_each('[{"name":"John"},{"name":"Jane"}]') as data"
 *   Explanation: Parse function calls that return tabular data for use in FROM clause
 * 
 * - Common Table Expressions (CTE)
 *   Example: "WITH regional_sales AS (SELECT region, SUM(sales) FROM data GROUP BY region) SELECT * FROM regional_sales"
 *   Explanation: Parse WITH clauses that define temporary named result sets
 * 
 * - LATERAL subqueries
 *   Example: "SELECT * FROM users u, LATERAL (SELECT * FROM orders WHERE user_id = u.id) o"
 *   Explanation: Parse subqueries that can reference columns from preceding tables
 * 
 * - VALUES clause as table source
 *   Example: "SELECT * FROM (VALUES (1, 'John'), (2, 'Jane')) as temp_data(id, name)"
 *   Explanation: Parse VALUES constructor as inline table source with column aliases
 * 
 * - Temporary table references
 *   Example: "SELECT * FROM #temp_table" or "SELECT * FROM temp.user_session"
 *   Explanation: Parse references to temporary tables and session-specific schemas
 */

export default class FromParser extends BaseParser<FromValues[]> {
    public get FromValues(): FromValues[] | undefined {
        return this.Values;
    }

    protected parse(): FromValues[] {
        const clause = this.extractClause(
            new RegExp(`from\\s+(.*?)${SqlUtils.createTerminatorPattern()}`, 'i'),
            "Invalid SQL query: FROM clause not found."
        );
        
        if (!clause) return [];

        return clause.content.split(',').map(table => 
            SqlUtils.parseTableWithAlias(table)
        );
    }
}