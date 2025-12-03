import { SelectExpressionsRule } from "types/index";

/**
 * **SqlUtils** - Advanced SQL parsing utility class providing comprehensive parsing operations.
 * 
 * This utility class serves as the cornerstone for SQL query parsing across the application,
 * offering a rich set of constants, regex patterns, and helper methods for analyzing SQL constructs.
 * All methods are static and thread-safe, making it suitable for use in any parsing context.
 * 
 * ### Key Features:
 * - **Clause Termination Detection**: Identify SQL clause boundaries
 * - **Table & Alias Parsing**: Extract table names with optional aliases
 * - **Operator Pattern Matching**: Robust SQL operator recognition
 * - **Keyword Filtering**: Comprehensive SQL keyword exclusion
 * - **Condition Splitting**: Parse complex WHERE clause conditions
 * 
 * ### Performance Characteristics:
 * - Zero memory allocation for static constants
 * - Optimized regex patterns with proper precedence
 * - Efficient string processing algorithms
 * 
 * @example Basic Usage
 * ```typescript
 * import { SqlUtils } from './SqlUtils';
 * 
 * // Parse a table with alias
 * const result = SqlUtils.parseTableWithAlias("users AS u");
 * console.log(result); // { tableName: "users", alias: "u" }
 * 
 * // Check if token is SQL keyword
 * const isKeyword = SqlUtils.SQL_ALL_KEYWORDS.includes('select'); // true
 * 
 * // Split complex conditions
 * const conditions = SqlUtils.splitByLogicalOperators(
 *   "age > 18 AND (status = 'active' OR role = 'admin')"
 * );
 * // Returns: ["age > 18", "(status = 'active'", "role = 'admin')"]
 * ```
 * 
 * @example Advanced Pattern Creation
 * ```typescript
 * // Create terminator pattern for parsing
 * const terminatorPattern = SqlUtils.createTerminatorPattern();
 * const regex = new RegExp(`(.+?)${terminatorPattern}`, 'i');
 * 
 * // Create operator pattern for condition parsing
 * const operatorPattern = SqlUtils.createOperatorPattern();
 * const conditionRegex = new RegExp(`(\\w+)\\s*(${operatorPattern})\\s*(.+)`, 'i');
 * ```
 * 
 * @example Column Filtering
 * ```typescript
 * // Filter out SQL functions and keywords from column lists
 * const columns = ['name', 'COUNT', 'age', 'SUM', 'email'];
 * const validColumns = columns.filter(col => 
 *   !SqlUtils.shouldExcludeFromColumns(col)
 * );
 * // Returns: ['name', 'age', 'email']
 * ```
 * 
 * @since 1.0.0
 * @author SQL Parser Team
 */
export class SqlUtils {
    /**
     * **Comprehensive SQL clause terminators** for precise query boundary detection.
     * 
     * This array contains all major SQL keywords that typically terminate clauses,
     * enabling accurate parsing of complex queries by identifying where one clause
     * ends and another begins. Essential for multi-clause query analysis.
     * 
     * ### Included Terminators:
     * - **Filtering**: WHERE, HAVING
     * - **Ordering**: ORDER BY, GROUP BY
     * - **Limiting**: LIMIT, OFFSET
     * - **Joining**: All JOIN variants (INNER, LEFT, RIGHT, FULL, CROSS)
     * - **Set Operations**: UNION, INTERSECT, EXCEPT
     * 
     * @readonly
     * @static
     * @since 1.0.0
     * 
     * @example Basic Terminator Check
     * ```typescript
     * const isTerminator = SqlUtils.CLAUSE_TERMINATORS.includes('WHERE'); // true
     * const isNotTerminator = SqlUtils.CLAUSE_TERMINATORS.includes('SELECT'); // false
     * ```
     * 
     * @example Query Parsing with Terminators
     * ```typescript
     * const query = "SELECT name, age FROM users WHERE status = 'active' ORDER BY name";
     * const terminators = SqlUtils.CLAUSE_TERMINATORS;
     * 
     * // Find first terminator position
     * const words = query.split(/\s+/);
     * const firstTerminator = words.find(word => 
     *   terminators.some(term => word.toUpperCase().startsWith(term))
     * );
     * console.log(firstTerminator); // "WHERE"
     * ```
     * 
     * @example Advanced Clause Splitting
     * ```typescript
     * function splitQueryIntoClauses(sql: string): string[] {
     *   const pattern = SqlUtils.createTerminatorPattern();
     *   return sql.split(new RegExp(pattern, 'i')).filter(Boolean);
     * }
     * 
     * const clauses = splitQueryIntoClauses(
     *   "SELECT * FROM users WHERE age > 18 ORDER BY name LIMIT 10"
     * );
     * // Returns: ["SELECT * FROM users", "age > 18", "name", "10"]
     * ```
     */
    static readonly CLAUSE_TERMINATORS = [
        'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'HAVING',
        'UNION', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
        'FULL JOIN', 'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN',
        'FULL OUTER JOIN'
    ];


    static readonly expressionRules: SelectExpressionsRule[] = [
        {
            name: 'COUNT',
            parameterRange: [1, 1]
        },
        {
            name: 'SUM',
            parameterRange: [1, 1]
        },
        {
            name: 'AVG',
            parameterRange: [1, 1]
        },
        {
            name: 'MIN',
            parameterRange: [1, 1]
        },
        {
            name: 'MAX',
            parameterRange: [1, 1]
        },
        {
            name: 'GROUP_CONCAT',
            parameterRange: [1, 2]
        },
        {
            name: 'TOTAL',
            parameterRange: [1, 1]
        },
        {
            name: 'ABS',
            parameterRange: [1, 1]
        },
        {
            name: 'ROUND',
            parameterRange: [1, 2]
        },
        {
            name: 'CEIL',
            parameterRange: [1, 1]
        },
        {
            name: 'FLOOR',
            parameterRange: [1, 1]
        },
        {
            name: 'POWER',
            parameterRange: [2, 2]
        },
        {
            name: 'SQRT',
            parameterRange: [1, 1]
        },
        {
            name: 'UPPER',
            parameterRange: [1, 1]
        },
        {
            name: 'LOWER',
            parameterRange: [1, 1]
        },
        {
            name: 'LENGTH',
            parameterRange: [1, 1]
        },
        {
            name: 'SUBSTR',
            parameterRange: [2, 3]
        },
        {
            name: 'TRIM',
            parameterRange: [1, 1]
        },
        {
            name: 'LTRIM',
            parameterRange: [1, 1]
        },
        {
            name: 'RTRIM',
            parameterRange: [1, 1]
        },
        {
            name: 'REPLACE',
            parameterRange: [3, 3]
        },
        {
            name: 'CONCAT',
            parameterRange: [1, 255]
        },
        {
            name: 'INSTR',
            parameterRange: [2, 2]
        },
        {
            name: 'DATE',
            parameterRange: [1, 2]
        },
        {
            name: 'TIME',
            parameterRange: [1, 2]
        },
        {
            name: 'DATETIME',
            parameterRange: [1, 2]
        },
        {
            name: 'STRFTIME',
            parameterRange: [2, 3]
        },
        {
            name: 'JULIANDAY',
            parameterRange: [1, 1]
        },
        {
            name: 'COALESCE',
            parameterRange: [2, 255]
        },
        {
            name: 'NULLIF',
            parameterRange: [2, 2]
        },
        {
            name: 'IFNULL',
            parameterRange: [2, 2]
        },
        {
            name: 'IIF',
            parameterRange: [3, 3]
        },
        {
            name: 'CAST',
            parameterRange: [1, 1]
        },
        {
            name: 'TYPEOF',
            parameterRange: [1, 1]
        },
        {
            name: 'ROW_NUMBER',
            parameterRange: [0, 0]
        },
        {
            name: 'RANK',
            parameterRange: [0, 0]
        },
        {
            name: 'DENSE_RANK',
            parameterRange: [0, 0]
        },
        {
            name: 'LAG',
            parameterRange: [1, 3]
        },
        {
            name: 'LEAD',
            parameterRange: [1, 3]
        },
        {
            name: 'JSON_EXTRACT',
            parameterRange: [2, 2]
        },
        {
            name: 'JSON_ARRAY',
            parameterRange: [0, 255]
        },
        {
            name: 'JSON_OBJECT',
            parameterRange: [0, 255]
        },
        {
            name: 'JSON_ARRAY_LENGTH',
            parameterRange: [1, 2]
        },
        {
            name: 'JSON_VALID',
            parameterRange: [1, 1]
        }
    ];

    /**
     * **Complete SQL operator collection** for comprehensive condition parsing.
     * 
     * Contains all standard SQL comparison and logical operators used in WHERE clauses,
     * HAVING conditions, and JOIN predicates. Includes both symbolic operators and
     * word-based operators with proper precedence considerations.
     * 
     * ### Operator Categories:
     * - **Equality**: `=`, `!=`, `<>`
     * - **Comparison**: `<`, `<=`, `>`, `>=`
     * - **Pattern Matching**: `LIKE`, `NOT LIKE`
     * - **Set Membership**: `IN`, `NOT IN`
     * - **Null Testing**: `IS NULL`, `IS NOT NULL`
     * - **Range Testing**: `BETWEEN`, `NOT BETWEEN`
     * 
     * @readonly
     * @static
     * @since 1.0.0
     * 
     * @example Operator Validation
     * ```typescript
     * const isValidOperator = SqlUtils.OPERATORS.includes('>='); // true
     * const isInvalid = SqlUtils.OPERATORS.includes('==='); // false
     * ```
     * 
     * @example Condition Parsing
     * ```typescript
     * function parseCondition(condition: string) {
     *   const operatorPattern = SqlUtils.createOperatorPattern();
     *   const regex = new RegExp(`(\\w+)\\s*(${operatorPattern})\\s*(.+)`, 'i');
     *   const match = condition.match(regex);
     *   
     *   if (match) {
     *     return {
     *       column: match[1],
     *       operator: match[2],
     *       value: match[3]
     *     };
     *   }
     *   return null;
     * }
     * 
     * const result = parseCondition("age >= 18");
     * // Returns: { column: "age", operator: ">=", value: "18" }
     * ```
     * 
     * @example Advanced Operator Detection
     * ```typescript
     * const complexCondition = "name LIKE '%john%' AND status IN ('active', 'pending')";
     * const operators = SqlUtils.OPERATORS;
     * 
     * // Find all operators in the condition
     * const foundOperators = operators.filter(op => 
     *   complexCondition.toLowerCase().includes(op.toLowerCase())
     * );
     * console.log(foundOperators); // ["LIKE", "IN"]
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
     * SQL control flow and conditional keywords.
     * 
     * Contains keywords used in CASE statements and other conditional constructs
     * that should be excluded from column name parsing.
     * 
     * @readonly
     * @static
     * @example
     * ```typescript
     * // Check if a keyword is a control flow keyword
     * const isKeyword = SqlUtils.SQL_KEYWORDS.includes('CASE');
     * ```
     */
    static readonly SQL_CONTROL_FLOW_KEYWORDS = [
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
    ];

    /**
     * All SQL keywords relevant for parsing.
     * 
     * A comprehensive list of SQL keywords that may appear in queries.
     * Useful for excluding keywords from being misinterpreted as identifiers.
     * 
     * @readonly
     * @static
     * @example
     * ```typescript
     * // Check if a token is an SQL keyword
     * const isSqlKeyword = SqlUtils.SQL_ALL_KEYWORDS.includes('SELECT');
     * ```
     */
    static readonly SQL_ALL_KEYWORDS = [
        'select', 'from', 'where', 'join', 'inner', 'left', 'right', 'full', 'cross',
        'on', 'and', 'or', 'not', 'in', 'exists', 'between', 'like', 'is', 'null',
        'order', 'by', 'group', 'having', 'limit', 'offset', 'distinct', 'as',
        'case', 'when', 'then', 'else', 'end', 'count', 'sum', 'avg', 'min', 'max',
        'union', 'intersect', 'except', 'all', 'any', 'some', 'with'
    ];

    static readonly SQL_SELECT_EXPRESSIONS_KEYWORDS = [
        "concat", "coalesce", "nullif", "ifnull", "cast", "typeof", "distinct"
    ];

    /**
     * Checks if a token should be excluded from column parsing.
     * 
     * Determines whether a token is an aggregate function or SQL keyword
     * that should not be treated as a column name during parsing.
     * 
     * @param token - The token to check
     * @returns True if the token should be excluded from column parsing
     * 
     * @example
     * ```typescript
     * const shouldExclude1 = SqlUtils.shouldExcludeFromColumns('COUNT');  // true
     * const shouldExclude2 = SqlUtils.shouldExcludeFromColumns('CASE');   // true
     * const shouldExclude3 = SqlUtils.shouldExcludeFromColumns('name');   // false
     * ```
     */
    static shouldExcludeFromColumns(token: string): boolean {
        const upperToken = token.toUpperCase();
        return this.AGGREGATE_FUNCTIONS.includes(upperToken) ||
            this.SQL_CONTROL_FLOW_KEYWORDS.includes(upperToken);
    }

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

    static splitByComma(content: string | undefined): string[] {
        if (!content) return [];
        const parts: string[] = [];

        while (content.trim().length > 0) {
            const functionMatch = content.match(/^(\w+)\s*\(/);

            if (functionMatch) {
                let openParens = 0;
                let endIndex = 0;

                for (; endIndex < content.length; endIndex++) {
                    if (content[endIndex] === '(') openParens++;
                    else if (content[endIndex] === ')') openParens--;
                    if (openParens === 0 && endIndex > functionMatch[0].length - 1) break;
                }

                let fullExpression = content.slice(0, endIndex + 1);
                let remainingContent = content.slice(endIndex + 1).trim();
                
                const aliasMatch = remainingContent.match(/^(as\s+\w+|\w+)(\s*,.*)?$/i);
                if (aliasMatch) {
                    const aliasLength = aliasMatch[1].length;
                    fullExpression += ' ' + remainingContent.slice(0, aliasLength);
                    remainingContent = remainingContent.slice(aliasLength).trim();
                }
                
                parts.push(fullExpression.trim());
                content = remainingContent;

                if (content.startsWith(',')) {
                    content = content.slice(1).trim();
                }
            } else if (content.startsWith('"') || content.startsWith("'") || content.startsWith('`')) {
                const quoteChar = content[0];
                let endIndex = 1;
                
                while (endIndex < content.length) {
                    if (content[endIndex] === quoteChar && content[endIndex - 1] !== '\\') {
                        break;
                    }
                
                    endIndex++;
                }
                
                parts.push(content.slice(0, endIndex + 1).trim());
                content = content.slice(endIndex + 1).trim();
                
                if (content.startsWith(',')) {
                    content = content.slice(1).trim();
                }
            } else {
                let parenDepth = 0;
                let actualCommaIndex = -1;
                
                for (let i = 0; i < content.length; i++) {
                    if (content[i] === '(') {
                        parenDepth++;
                    } else if (content[i] === ')') {
                        parenDepth--;
                    } else if (content[i] === ',' && parenDepth === 0) {
                        actualCommaIndex = i;
                        break;
                    }
                }
                
                if (actualCommaIndex === -1) {
                    parts.push(content.trim());
                    break;
                } else {
                    parts.push(content.slice(0, actualCommaIndex).trim());
                    content = content.slice(actualCommaIndex + 1).trim();
                }
            }
        }

        return parts;
    }
}