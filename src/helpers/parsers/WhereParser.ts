import { OperatorTypes, WhereValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Parser for SQL WHERE clause conditions.
 * 
 * CURRENT FEATURES:
 * ✅ AND/OR logical operators
 * ✅ Comparison operators (=, !=, <>, <, <=, >, >=)
 * ✅ LIKE/NOT LIKE pattern matching
 * ✅ IN/NOT IN list matching
 * ✅ IS NULL/IS NOT NULL null checks
 * ✅ Parentheses for grouping conditions
 * 
 * TODO FEATURES:
 * 
 * - NOT operator
 *   Example: "SELECT * FROM users WHERE NOT (age < 18 OR status = 'inactive')"
 *   Explanation: Parse NOT operator for negating conditions and expressions
 * 
 * - BETWEEN/NOT BETWEEN range conditions
 *   Example: "SELECT * FROM products WHERE price BETWEEN 10.00 AND 50.00"
 *   Explanation: Parse range conditions for numeric, date, and string values
 * 
 * - EXISTS/NOT EXISTS subquery conditions
 *   Example: "SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE user_id = users.id)"
 *   Explanation: Parse subquery existence checks for correlated queries
 * 
 * - Complex expression parsing
 *   Example: "SELECT * FROM products WHERE (price * 0.9) > 25 AND category IN ('electronics', 'books')"
 *   Explanation: Parse mathematical expressions and function calls within conditions
 * 
 * - Regular expressions (REGEXP)
 *   Example: "SELECT * FROM users WHERE email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'"
 *   Explanation: Parse regular expression pattern matching conditions
 * 
 * - GLOB pattern matching
 *   Example: "SELECT * FROM files WHERE filename GLOB '*.txt'"
 *   Explanation: Parse Unix-style glob pattern matching (SQLite specific)
 */

export default class WhereParser extends BaseParser<WhereValues[]> {
    public get WhereValues(): WhereValues[] | undefined {
        return this.Values;
    }

    protected parse(): WhereValues[] {
        const clause = this.extractClause(
            new RegExp(`where\\s+(.*?)${SqlUtils.createTerminatorPattern()}`, 'i'),
            "Invalid SQL query: WHERE clause not found."
        );
        
        if (!clause) return [];

        return SqlUtils.splitByLogicalOperators(clause.content).map(condition => {
            const match = condition.match(new RegExp(
                `(.*?)\\s*(${SqlUtils.createOperatorPattern()})\\s*(.*)`, 'i'
            ));

            if (match) {
                return {
                    value: match[1].trim(),
                    condition: match[2].trim().toUpperCase() as OperatorTypes,
                    searchValue: match[3].trim()
                };
            } else {
                throw new Error(`Invalid condition in WHERE clause: ${condition}`);
            }
        });
    }
}