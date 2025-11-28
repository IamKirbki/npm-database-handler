import { SelectValues } from "types/index";

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

export default class SelectParser {
    private readonly AGGREGATE_FUNCTIONS = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'TRIM',
        'ROUND', 'ABS', 'DISTINCT', "CASE", "WHEN", "THEN", "ELSE", "END"
    ];

    private readonly query: string;

    private _selectValues?: SelectValues[];
    public get SelectValues(): SelectValues[] | undefined {
        return this._selectValues;
    }

    constructor(query: string) {
        this.query = query.split('\n').map(line => line.trim()).join(' ');
        const columns = this.ParseColumns();
        const expressions = this.ParseExpressions();

        columns.forEach((col, index) => {
            this._selectValues?.push({ columns: col, expressions: expressions[index] || '' });
        });
    }

    private ParseColumns(): string[] {
        const selectClause = this.query.match(/select\s+(.*?)\s+from/i);
        if (!selectClause || selectClause.length < 2) {
            throw new Error("Invalid SQL query: SELECT clause not found.");
        }

        let selectContent = selectClause[1].trim();
        
        selectContent = selectContent.replace(/^distinct\s+/i, '');
        
        const columns = selectContent.split(',').map(col => col.replace(/\s+as\s+\w+/i, '').trim());
        const regex = /[+\-*/()]/;

        return columns.map(col => {
            if (/\bcase\b/i.test(col)) {
                const whenMatches = col.match(/when\s+(\w+(?:\.\w+)?)\s*[><=!]/gi);
                if (whenMatches) {
                    return whenMatches.map(when => {
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
                    .map(part => part.trim())
                    .filter(part =>
                        part &&
                        !/^\d+(\.\d+)?$/.test(part) &&
                        !this.AGGREGATE_FUNCTIONS.includes(part.toUpperCase())
                    );
            }

            return [col];
        }).flat();
    }

    private ParseExpressions(): string[] {
        const selectClause = this.query.match(/select\s+(.*?)\s+from/i);
        if (!selectClause || selectClause.length < 2) {
            throw new Error("Invalid SQL query: SELECT clause not found.");
        }

        let selectContent = selectClause[1].trim();
        
        selectContent = selectContent.replace(/^distinct\s+/i, '');

        const columns = selectContent.split(',').map(col => col.trim());
        const regex = /[+\-*/()]/;
        
        return columns.filter(col => {
            if (/\bcase\b/i.test(col)) {
                return true;
            }
            return regex.test(col);
        });
    }
}