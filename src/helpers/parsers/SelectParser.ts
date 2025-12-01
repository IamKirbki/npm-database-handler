import { SelectValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Parser for SQL SELECT clause components.
 * 
 * CURRENT FEATURES:
 * ✅ Basic column selection
 * ✅ DISTINCT keyword
 * ✅ Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
 * ✅ Column aliases with AS
 * 
 * TODO FEATURES:
 * 
 * - Subqueries (in SELECT, FROM, WHERE)
 *   Example: "SELECT name, (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count FROM users"
 *   Explanation: Parse nested SELECT statements within main query clauses
 * 
 * - UNION/INTERSECT/EXCEPT
 *   Example: "SELECT name FROM customers UNION SELECT name FROM suppliers"
 *   Explanation: Combine results from multiple SELECT statements with set operations
 * 
 * - Window functions (OVER, PARTITION BY)
 *   Example: "SELECT name, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) FROM employees"
 *   Explanation: Parse analytical functions that operate over a window of rows
 * 
 * - Common Table Expressions (WITH/CTE)
 *   Example: "WITH sales_summary AS (SELECT region, SUM(amount) FROM sales GROUP BY region) SELECT * FROM sales_summary"
 *   Explanation: Parse WITH clauses that define temporary named result sets
 * 
 * - Wildcards in column selection (*)
 *   Example: "SELECT users.*, orders.total FROM users JOIN orders ON users.id = orders.user_id"
 *   Explanation: Handle asterisk wildcards, especially with table prefixes
 * 
 * - Table-qualified column names (table.column)
 *   Example: "SELECT users.name, orders.total FROM users JOIN orders ON users.id = orders.user_id"
 *   Explanation: Parse columns with table prefixes for disambiguation
 * 
 * - Schema-qualified names (schema.table.column)
 *   Example: "SELECT public.users.name, sales.orders.total FROM public.users"
 *   Explanation: Parse fully qualified column names including schema
 * 
 * - Expression parsing (mathematical, string concatenation)
 *   Example: "SELECT name, (price * quantity) as total, CONCAT(first_name, ' ', last_name) as full_name FROM products"
 *   Explanation: Parse complex expressions involving operators and functions
 * 
 * - CASE WHEN statements
 *   Example: "SELECT name, CASE WHEN age < 18 THEN 'Minor' WHEN age < 65 THEN 'Adult' ELSE 'Senior' END as category FROM users"
 *   Explanation: Parse conditional logic expressions in SELECT clauses
 */

export default class SelectParser extends BaseParser<SelectValues[]> {
    public get SelectValues(): SelectValues[] | undefined {
        return this._values;
    }

    protected parse(): SelectValues[] {
        const columns = this.ParseColumns();
        const expressions = this.ParseExpressions();
        const selectValues: SelectValues[] = [];

        columns.forEach((col, index) => {
            selectValues.push({ columns: col, expressions: expressions[index] || '' });
        });
        
        return selectValues;
    }

    /**
     * Extracts the main SELECT clause from SQL query, handling CTE (WITH clauses).
     * 
     * For regular queries, finds the SELECT...FROM pattern.
     * For CTE queries, finds the main SELECT clause that comes after all WITH clauses.
     * 
     * @returns The main SELECT clause content or null if not found
     * 
     * @example
     * ```typescript
     * // Regular query
     * "SELECT id, name FROM users" -> "id, name"
     * 
     * // CTE query
     * "WITH temp AS (...) SELECT u.id, u.name FROM users u" -> "u.id, u.name"
     * ```
     */
    private extractMainSelectClause(): string | null {
        const query = this.query.toLowerCase();
        
        // Check if this is a CTE query (starts with WITH)
        if (query.trim().startsWith('with')) {
            return this.extractMainSelectFromCTE();
        }
        
        // Regular query - use the existing logic
        const selectClause = this.extractClause(/select\s+(.*?)\s+from/i);
        return selectClause ? selectClause.content : null;
    }

    /**
     * Extracts the main SELECT clause from a CTE (WITH) query.
     * 
     * Identifies the main SELECT statement that comes after all WITH clauses
     * by finding the SELECT that is not preceded by another keyword that would
     * indicate it's part of a CTE definition.
     * 
     * @returns The main SELECT clause content or null if not found
     */
    private extractMainSelectFromCTE(): string | null {
        const query = this.query;
        
        // Find all SELECT statements and their positions
        const selectMatches = [...query.matchAll(/\bselect\s+/gi)];
        if (selectMatches.length === 0) return null;
        
        // For each SELECT, check if it's the main one by looking backwards
        // for keywords that indicate it's part of a CTE
        for (let i = selectMatches.length - 1; i >= 0; i--) {
            const match = selectMatches[i];
            const selectIndex = match.index;
            if (selectIndex === undefined) continue;
            
            // Get the text before this SELECT to analyze context
            const beforeSelect = query.substring(0, selectIndex).trim().toLowerCase();
            
            // Skip if this SELECT is part of a CTE definition, subquery, or other clause
            if (this.isSelectPartOfSubstructure(beforeSelect)) {
                continue;
            }
            
            // This should be the main SELECT - extract its content
            const fromMatch = query.substring(selectIndex).match(/\bfrom\s+/i);
            if (!fromMatch || fromMatch.index === undefined) continue;
            
            const selectStart = selectIndex + match[0].length;
            const fromStart = selectIndex + fromMatch.index;
            const selectContent = query.substring(selectStart, fromStart).trim();
            
            return selectContent;
        }
        
        return null;
    }

    /**
     * Determines if a SELECT statement is part of a substructure (CTE, subquery, etc.)
     * rather than the main SELECT clause.
     * 
     * @param beforeSelect Text that appears before the SELECT statement
     * @returns true if the SELECT is part of a substructure
     */
    private isSelectPartOfSubstructure(beforeSelect: string): boolean {
        // Remove parentheses and their contents to focus on main structure
        const cleaned = beforeSelect.replace(/\([^)]*\)/g, '');
        
        // Check if we're inside a CTE definition
        const ctePattern = /\b(with\s+(?:recursive\s+)?\w+\s+as|,\s*\w+\s+as)\s*$/i;
        if (ctePattern.test(cleaned)) {
            return true;
        }
        
        // Check if we're inside a subquery (opening parenthesis without closing)
        let parenCount = 0;
        for (const char of beforeSelect) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
        }
        if (parenCount > 0) {
            return true;
        }
        
        // Check if the SELECT follows keywords that indicate subquery context
        const subqueryKeywords = /\b(exists|in|any|all|case|when)\s*$/i;
        if (subqueryKeywords.test(cleaned)) {
            return true;
        }
        
        return false;
    }

    private ParseColumns(): string[] {
        const selectContent = this.extractMainSelectClause();
        if (!selectContent) {
            return [];
        }

        let cleanedContent = selectContent.trim();
        
        cleanedContent = cleanedContent.replace(/^distinct\s+/i, '');
        
        const columns = cleanedContent.split(',').map((col: string) => col.replace(/\s+as\s+\w+/i, '').trim());
        const regex = /[+\-*/()]/;

        return columns.map((col: string) => {
            if (/\bcase\b/i.test(col)) {
                const whenMatches = col.match(/when\s+(\w+(?:\.\w+)?)\s*[><=!]/gi);
                if (whenMatches) {
                    return whenMatches.map((when: string) => {
                        const match = when.match(/when\s+(\w+(?:\.\w+)?)/i);
                        return match ? match[1] : '';
                    }).filter(Boolean);
                }
                return [];
            }
            
            if (regex.test(col) && col.trim() !== "*") {
                const columnNames = col
                    .replace(/\s+as\s+\w+/i, '');

                return columnNames
                    .split(columnNames.includes("(*)") ? /[+\-/()]/ : /[+\-*/()]/)
                    .map((part: string) => part.trim())
                    .filter((part: string) =>
                        part &&
                        !/^\d+(\.\d+)?$/.test(part) &&
                        !SqlUtils.shouldExcludeFromColumns(part)
                    );
            }

            return [col];
        }).flat();
    }

    private ParseExpressions(): string[] {
        const selectContent = this.extractMainSelectClause();
        if (!selectContent) {
            return [];
        }

        let cleanedContent = selectContent.trim();
        
        cleanedContent = cleanedContent.replace(/^distinct\s+/i, '');

        const columns = cleanedContent.split(',').map((col: string) => col.trim());
        const regex = /[+\-*/()]/;
        
        return columns.filter((col: string) => {
            if (/\bcase\b/i.test(col)) {
                return true;
            }
            return regex.test(col);
        });
    }
}