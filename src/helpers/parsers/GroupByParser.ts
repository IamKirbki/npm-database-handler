import { GroupByValues, OperatorTypes } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Parser for SQL GROUP BY and HAVING clause components.
 * 
 * CURRENT FEATURES:
 * ✅ GROUP BY (single and multiple columns)
 * ✅ HAVING clause with conditions
 * ✅ Aggregate functions in HAVING
 * ✅ Complex HAVING expressions
 * 
 * TODO FEATURES:
 * 
 * - ROLLUP grouping
 *   Example: "SELECT region, country, SUM(sales) FROM data GROUP BY ROLLUP(region, country)"
 *   Explanation: Parse ROLLUP for hierarchical grouping with subtotals at each level
 * 
 * - CUBE grouping
 *   Example: "SELECT region, product, SUM(sales) FROM data GROUP BY CUBE(region, product)"
 *   Explanation: Parse CUBE for all possible combinations of grouping columns
 * 
 * - GROUPING SETS
 *   Example: "SELECT region, product, SUM(sales) FROM data GROUP BY GROUPING SETS ((region), (product), ())"
 *   Explanation: Parse explicit specification of grouping combinations
 * 
 * - Window functions with PARTITION BY
 *   Example: "SELECT name, salary, AVG(salary) OVER (PARTITION BY department) as dept_avg FROM employees"
 *   Explanation: Parse window functions that partition data for analytical calculations
 * 
 * - FILTER clause for aggregates
 *   Example: "SELECT COUNT(*) FILTER (WHERE age > 18) as adults, COUNT(*) as total FROM users GROUP BY city"
 *   Explanation: Parse conditional aggregation using FILTER clause
 */

export default class GroupByParser extends BaseParser<GroupByValues[]> {
    private _groupByValues?: GroupByValues[];
    
    public get GroupByValues(): GroupByValues[] | undefined {
        return this._groupByValues;
    }

    constructor(query: string) {
        super(query);
        this._groupByValues = this.parse();
    }

    protected parse(): GroupByValues[] {
        const clause = this.extractClause(
            /group\s+by\s+(.*?)(?:\s+(?:having|order\s+by|limit)|;|$)/i
        );
        
        if (!clause) {
            return [];
        }

        const columns = clause.content
            .split(',')
            .map((col: string) => col.trim())
            .filter((col: string) => col.length > 0);
        
        const havingConditions = this.parseHavingClause();

        return [{
            columns,
            havingConditions
        }];
    }

    private parseHavingClause() {
        const havingClause = this.extractClause(
            /having\s+(.*?)(?:\s+(?:order\s+by|limit)|;|$)/i
        );
        
        if (!havingClause) {
            return undefined;
        }

        const operatorPattern = `(\\w+(?:\\.\\w+)?|\\w+\\([^)]*\\))\\s*(${SqlUtils.createOperatorPattern()})\\s*(.+)`;
        const havingMatch = havingClause.content.match(new RegExp(operatorPattern, 'i'));
        
        if (havingMatch && havingMatch.length >= 4) {
            return {
                value: havingMatch[1].trim(),
                condition: havingMatch[2].trim() as OperatorTypes,
                searchValue: havingMatch[3].trim()
            };
        }

        return undefined;
    }
}