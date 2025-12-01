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
 * ✅ Common Table Expressions (WITH/CTE) - Main SELECT extraction
 * ✅ Table-qualified column names (table.column) - Basic support
 * ✅ CASE WHEN statements - Basic column extraction from WHEN clauses
 * ✅ Mathematical expressions - Basic arithmetic operator parsing
 * ✅ Parentheses handling in expressions
 * ✅ String literal safety in parsing
 * 
 * INTEGRATION NOTES:
 * - Called by Parser.ts for main SELECT clause extraction from complex queries
 * - Handles CTE queries by identifying main SELECT vs subquery SELECT statements
 * - Returns SelectValues[] with {columns, expressions} structure for Parser consumption
 * 
 * TODO FEATURES:
 * 
 * - Enhanced Subquery Support
 *   Example: "SELECT name, (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count FROM users"
 *   Current: Basic parsing, needs better nested subquery column extraction
 *   Explanation: Improve extraction of columns from deeply nested SELECT subqueries
 * 
 * - UNION/INTERSECT/EXCEPT Operations
 *   Example: "SELECT name FROM customers UNION SELECT name FROM suppliers"
 *   Status: Not implemented - needs Parser.ts coordination
 *   Explanation: Handle set operations that combine multiple SELECT statements
 * 
 * - Advanced Window Functions
 *   Example: "SELECT name, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) FROM employees"  
 *   Current: Basic recognition, needs OVER clause parsing
 *   Explanation: Extract PARTITION BY and ORDER BY clauses from window functions
 * 
 * - Enhanced Wildcard Support
 *   Example: "SELECT users.*, orders.total FROM users JOIN orders ON users.id = orders.user_id"
 *   Current: Basic * handling, needs table-prefixed wildcards
 *   Explanation: Properly expand table-qualified wildcards (table.*)
 * 
 * - Schema-qualified Names
 *   Example: "SELECT public.users.name, sales.orders.total FROM public.users"
 *   Status: Not implemented
 *   Explanation: Parse three-part column names (schema.table.column)
 * 
 * - Advanced Expression Parsing
 *   Example: "SELECT CONCAT(first_name, ' ', last_name) as full_name, COALESCE(email, 'no-email') FROM users"
 *   Current: Basic math operators, needs function call parsing
 *   Explanation: Better function call recognition and nested expression handling
 * 
 * - Complex CASE Statement Support  
 *   Example: "SELECT CASE WHEN age < 18 THEN 'Minor' WHEN age BETWEEN 18 AND 65 THEN 'Adult' ELSE 'Senior' END FROM users"
 *   Current: Basic WHEN column extraction, needs full CASE parsing
 *   Explanation: Parse complete CASE expressions including THEN/ELSE values and nested conditions
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