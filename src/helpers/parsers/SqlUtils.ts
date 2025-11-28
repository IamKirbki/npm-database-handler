/**
 * Utility class providing common SQL parsing operations and constants.
 * 
 * This class serves as a centralized repository of SQL parsing utilities
 * used across different SQL parser implementations. It provides regex patterns,
 * constants, and helper methods for parsing various SQL constructs.
 * 
 * @example
 * ```typescript
 * // Create a terminator pattern for clause parsing
 * const pattern = SqlUtils.createTerminatorPattern();
 * 
 * // Parse table names with aliases
 * const table = SqlUtils.parseTableWithAlias("users AS u");
 * console.log(table); // { tableName: "users", alias: "u" }
 * 
 * // Split conditions by logical operators
 * const conditions = SqlUtils.splitByLogicalOperators("age > 18 AND status = 'active'");
 * ```
 */
export class SqlUtils {
    /**
     * Common SQL clause terminators used to identify the end of SQL clauses.
     * 
     * This array contains keywords that typically terminate SQL clauses,
     * useful for parsing queries where you need to find the boundary between
     * different parts of a SQL statement.
     * 
     * @readonly
     * @static
     * @example
     * ```typescript
     * // Check if a keyword is a clause terminator
     * const isTerminator = SqlUtils.CLAUSE_TERMINATORS.includes('WHERE');
     * ```
     */
    static readonly CLAUSE_TERMINATORS = [
        'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'HAVING', 
        'UNION', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
        'FULL JOIN', 'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 
        'FULL OUTER JOIN'
    ];

    /**
     * Common SQL comparison and logical operators.
     * 
     * Contains both symbolic operators (=, !=, <, >, etc.) and word-based
     * operators (LIKE, IN, IS NULL, etc.) used in SQL WHERE clauses and
     * other conditional expressions.
     * 
     * @readonly
     * @static
     * @example
     * ```typescript
     * // Check if a token is a valid operator
     * const isOperator = SqlUtils.OPERATORS.includes('>=');
     * ```
     */
    static readonly OPERATORS = ['=', '!=', '<>', '<', '<=', '>', '>=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];

    /**
     * Common SQL aggregate and scalar functions.
     * 
     * Contains frequently used SQL functions for aggregation (COUNT, SUM, etc.)
     * and string/numeric manipulation (UPPER, LOWER, etc.).
     * 
     * @readonly
     * @static
     * @example
     * ```typescript
     * // Check if a function name is a known aggregate function
     * const isAggregate = SqlUtils.AGGREGATE_FUNCTIONS.includes('COUNT');
     * ```
     */
    static readonly AGGREGATE_FUNCTIONS = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 
        'LENGTH', 'SUBSTR', 'TRIM', 'ROUND', 'ABS', 'DISTINCT'
    ];

    /**
     * Creates a regex pattern that matches SQL clause terminators.
     * 
     * Generates a regex pattern string that can be used to identify where
     * SQL clauses end. The pattern includes all clause terminators with
     * proper whitespace handling and also matches semicolons and end of string.
     * 
     * @returns A regex pattern string for matching clause terminators
     * 
     * @example
     * ```typescript
     * const pattern = SqlUtils.createTerminatorPattern();
     * const regex = new RegExp(pattern, 'i');
     * const match = "SELECT * FROM users WHERE age > 18 ORDER BY name".match(regex);
     * // Matches " ORDER BY" as a terminator
     * ```
     */
    static createTerminatorPattern(): string {
        return `(${this.CLAUSE_TERMINATORS.map(term => 
            term.includes(' ') ? `\\s+${term.replace(' ', '\\s+')}` : `\\s+${term}`
        ).join('|')}|;|$)`;
    }

    /**
     * Creates a regex pattern that matches SQL operators with proper word boundaries.
     * 
     * Generates a regex pattern that matches all SQL operators while handling:
     * - Word-based operators (LIKE, IN) with word boundaries to prevent partial matches
     * - Symbol-based operators (=, !=) with proper escaping
     * - Proper precedence by sorting longer operators first
     * 
     * @returns A regex pattern string for matching SQL operators
     * 
     * @example
     * ```typescript
     * const pattern = SqlUtils.createOperatorPattern();
     * const regex = new RegExp(`(\\w+)\\s*(${pattern})\\s*(.+)`, 'i');
     * const match = "name LIKE 'John%'".match(regex);
     * // Returns: ["name LIKE 'John%'", "name", "LIKE", "'John%'"]
     * ```
     */
    static createOperatorPattern(): string {
        return this.OPERATORS
            .sort((a, b) => b.length - a.length) // Longer operators first
            .map(op => {
                // Add word boundaries for operators that are words
                if (/^[A-Z\s]+$/.test(op)) {
                    return `\\b${op.replace(/\s+/g, '\\s+')}\\b`;
                }
                // Escape special regex characters for symbol operators
                return op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            })
            .join('|');
    }

    /**
     * Parses a table reference string to extract table name and optional alias.
     * 
     * Handles both explicit alias syntax (table AS alias) and implicit syntax
     * (table alias). Returns an object with the table name and optional alias.
     * 
     * @param tableString - The table reference string to parse
     * @returns Object containing tableName and optional alias
     * 
     * @example
     * ```typescript
     * // Explicit alias
     * const result1 = SqlUtils.parseTableWithAlias("users AS u");
     * // Returns: { tableName: "users", alias: "u" }
     * 
     * // Implicit alias
     * const result2 = SqlUtils.parseTableWithAlias("users u");
     * // Returns: { tableName: "users", alias: "u" }
     * 
     * // No alias
     * const result3 = SqlUtils.parseTableWithAlias("users");
     * // Returns: { tableName: "users", alias: undefined }
     * ```
     */
    static parseTableWithAlias(tableString: string): { tableName: string; alias?: string } {
        const parts = tableString.trim().split(/\s+as\s+|\s+/i).filter(part => part.length > 0);
        return {
            tableName: parts[0],
            alias: parts[1] || undefined
        };
    }

    /**
     * Splits a string by logical operators (AND, OR) while preserving the operands.
     * 
     * Splits a condition string on logical operators, filtering out the operators
     * themselves and returning only the individual conditions. Useful for parsing
     * complex WHERE clauses with multiple conditions.
     * 
     * @param content - The string containing logical conditions to split
     * @returns Array of individual condition strings
     * 
     * @example
     * ```typescript
     * const conditions = SqlUtils.splitByLogicalOperators("age > 18 AND status = 'active' OR role = 'admin'");
     * // Returns: ["age > 18", "status = 'active'", "role = 'admin'"]
     * 
     * const simple = SqlUtils.splitByLogicalOperators("name = 'John'");
     * // Returns: ["name = 'John'"]
     * ```
     */
    static splitByLogicalOperators(content: string): string[] {
        return content
            .split(/(\s+and\s+|\s+or\s+)/i)
            .filter(part => !/^\s*(and|or)\s*$/i.test(part))
            .map(part => part.trim());
    }
}