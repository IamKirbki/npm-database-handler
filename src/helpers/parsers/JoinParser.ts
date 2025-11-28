import { JoinTypes, JoinValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Parser for SQL JOIN clause components.
 * 
 * CURRENT FEATURES:
 * ✅ INNER JOIN
 * ✅ LEFT JOIN/LEFT OUTER JOIN
 * ✅ RIGHT JOIN/RIGHT OUTER JOIN
 * ✅ FULL JOIN/FULL OUTER JOIN
 * ✅ CROSS JOIN
 * ✅ Multiple JOINs in same query
 * ✅ ON conditions with complex expressions
 * 
 * TODO FEATURES:
 * 
 * - NATURAL JOIN
 *   Example: "SELECT * FROM users NATURAL JOIN profiles"
 *   Explanation: Parse joins that automatically match columns with same names
 * 
 * - SELF JOIN detection and optimization
 *   Example: "SELECT e1.name as employee, e2.name as manager FROM employees e1 JOIN employees e2 ON e1.manager_id = e2.id"
 *   Explanation: Detect when a table joins with itself and provide optimization hints
 * 
 * - JOIN hints and optimization suggestions
 *   Example: "SELECT * FROM users u JOIN orders o ON u.id = o.user_id"
 *   Explanation: Parse database-specific hints for join optimization (e.g., USE_INDEX, FORCE_INDEX)
 * 
 * - USING clause (alternative to ON)
 *   Example: "SELECT * FROM users JOIN profiles USING (user_id)"
 *   Explanation: Parse USING clause as shorthand for equi-joins on common column names
 * 
 * - Lateral joins
 *   Example: "SELECT * FROM users u CROSS JOIN LATERAL (SELECT * FROM orders WHERE user_id = u.id LIMIT 3) o"
 *   Explanation: Parse lateral joins that reference columns from preceding tables
 */

export default class JoinParser extends BaseParser<JoinValues[]> {
    public get JoinValues(): JoinValues[] | undefined {
        return this.Values;
    }

    protected parse(): JoinValues[] {
        const joinTypes = [
            "SELF JOIN", "NATURAL JOIN", "INNER JOIN", "LEFT OUTER JOIN", 
            "RIGHT OUTER JOIN", "FULL OUTER JOIN", "LEFT JOIN", "RIGHT JOIN", 
            "FULL JOIN", "CROSS JOIN", "JOIN"
        ];
        
        const joinTypePattern = `\\b(${joinTypes.join('|').replace(/\s/g, '\\s+')})`;
        const tableNamePattern = `\\s+([a-zA-Z_][a-zA-Z0-9_]*)`;
        const aliasPattern = `(?:\\s+(?:AS\\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?`;
        const onConditionPattern = `\\s+ON\\s+(.+?)`;
        const lookaheadPattern = `(?=${joinTypes.join('|').replace(/\s/g, '\\s+')}|${SqlUtils.createTerminatorPattern()})`;

        const joinRegex = new RegExp(
            `${joinTypePattern}${tableNamePattern}${aliasPattern}${onConditionPattern}${lookaheadPattern}`,
            "gi"
        );
        
        const joins: JoinValues[] = [];
        let match: RegExpExecArray | null;

        while ((match = joinRegex.exec(this.query)) !== null) {
            const joinType = match[1].replace(/\s+/g, ' ').toUpperCase() as JoinTypes;
            const tableName = match[2];
            const alias = match[3] || undefined;
            const onCondition = match[4].trim();

            joins.push({
                joinType,
                tableName,
                alias,
                onCondition
            });
        }

        return joins;
    }
}