/**
 * ExampleParser.ts - Comprehensive example demonstrating how to create SQL parsers
 * using the BaseParser class and SqlUtils utilities.
 * 
 * This file serves as a complete guide for creating new SQL clause parsers
 * following the established DRY (Don't Repeat Yourself) patterns.
 */

import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Example: Creating a simple ORDER BY parser
 * 
 * This demonstrates the minimal steps to create a new parser:
 * 1. Define the return type
 * 2. Extend BaseParser<T>
 * 3. Implement the parse() method
 * 4. Add public getter for convenience
 */

// Step 1: Define the return type for your parser
interface OrderByColumn {
    column: string;
    direction: 'ASC' | 'DESC';
}

// Step 2: Extend BaseParser with your return type
export class OrderByParser extends BaseParser<OrderByColumn[]> {
    
    // Step 4: Add public getter for convenience (optional but recommended)
    public get OrderByValues(): OrderByColumn[] | undefined {
        return this.Values;
    }

    // Step 3: Implement the parse() method
    protected parse(): OrderByColumn[] {
        // Use extractClause to get the ORDER BY content
        const clause = this.extractClause(
            new RegExp(`order\\s+by\\s+(.*?)${SqlUtils.createTerminatorPattern()}`, 'i'),
            // Error message is optional - omit for clauses that might not exist
            // "Invalid SQL query: ORDER BY clause not found."
        );
        
        // Return empty array if clause doesn't exist
        if (!clause) return [];

        // Parse the clause content
        return clause.content.split(',').map(item => {
            const parts = item.trim().split(/\s+/);
            const column = parts[0];
            const direction = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            
            return { column, direction };
        });
    }
}

/**
 * Example: Creating a more complex LIMIT/OFFSET parser
 * 
 * This demonstrates:
 * - Handling optional clauses
 * - Parsing multiple related values
 * - Using regex groups for extraction
 */

interface LimitValues {
    limit?: number;
    offset?: number;
}

export class LimitParser extends BaseParser<LimitValues> {
    
    public get LimitValues(): LimitValues | undefined {
        return this.Values;
    }

    protected parse(): LimitValues {
        const result: LimitValues = {};
        
        // Extract LIMIT clause (may include OFFSET)
        const limitMatch = this.query.match(/limit\s+(\d+)(?:\s+offset\s+(\d+))?/i);
        
        if (limitMatch) {
            result.limit = parseInt(limitMatch[1], 10);
            if (limitMatch[2]) {
                result.offset = parseInt(limitMatch[2], 10);
            }
        }
        
        // Check for standalone OFFSET clause
        if (!limitMatch) {
            const offsetMatch = this.query.match(/offset\s+(\d+)/i);
            if (offsetMatch) {
                result.offset = parseInt(offsetMatch[1], 10);
            }
        }
        
        return result;
    }
}

/**
 * Example: Creating a parser with conditional logic (HAVING clause)
 * 
 * This demonstrates:
 * - Using SqlUtils for operator patterns
 * - Conditional parsing based on clause existence
 * - Working with WhereValues-like structures
 */

interface HavingValues {
    value: string;
    condition: string;
    searchValue: string;
}

export class HavingParser extends BaseParser<HavingValues[]> {
    
    public get HavingValues(): HavingValues[] | undefined {
        return this.Values;
    }

    protected parse(): HavingValues[] {
        const clause = this.extractClause(
            new RegExp(`having\\s+(.*?)${SqlUtils.createTerminatorPattern()}`, 'i')
        );
        
        if (!clause) return [];

        // Split by logical operators (AND/OR) using SqlUtils
        return SqlUtils.splitByLogicalOperators(clause.content).map(condition => {
            // Use SqlUtils operator pattern for consistent parsing
            const match = condition.match(new RegExp(
                `(.*?)\\s*(${SqlUtils.createOperatorPattern()})\\s*(.*)`, 'i'
            ));

            if (match) {
                return {
                    value: match[1].trim(),
                    condition: match[2].trim().toUpperCase(),
                    searchValue: match[3].trim()
                };
            } else {
                throw new Error(`Invalid condition in HAVING clause: ${condition}`);
            }
        });
    }
}

/**
 * USAGE EXAMPLES
 * 
 * Here's how to use the parsers in your application:
 */

/* 
Example 1: Basic ORDER BY parsing

const sql = "SELECT * FROM users ORDER BY name ASC, created_at DESC";
const parser = new OrderByParser(sql);

// Returns: [
//   { column: 'name', direction: 'ASC' },
//   { column: 'created_at', direction: 'DESC' }
// ]
const orderByResults = parser.OrderByValues;

Example 2: LIMIT with OFFSET

const sql = "SELECT * FROM products LIMIT 10 OFFSET 20";
const parser = new LimitParser(sql);

// Returns: { limit: 10, offset: 20 }
const limitResults = parser.LimitValues;

Example 3: HAVING clause with conditions

const sql = "SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5";
const parser = new HavingParser(sql);

// Returns: [{ value: 'COUNT(*)', condition: '>', searchValue: '5' }]
const havingResults = parser.HavingValues;
*/

/**
 * ADVANCED PATTERNS
 * 
 * Here are some advanced patterns for complex parsing scenarios:
 */

/**
 * Pattern 1: Parser with validation
 */
export class ValidatedParser extends BaseParser<string[]> {
    
    protected parse(): string[] {
        const clause = this.extractClause(/custom\s+clause\s+(.*?)$/i);
        if (!clause) return [];
        
        const values = clause.content.split(',').map(v => v.trim());
        
        // Add validation logic
        values.forEach(value => {
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                throw new Error(`Invalid value in custom clause: ${value}`);
            }
        });
        
        return values;
    }
}

/**
 * Pattern 2: Parser with preprocessing
 */
export class PreprocessedParser extends BaseParser<Record<string, string>> {
    
    protected parse(): Record<string, string> {
        // Override normalizeQuery for special preprocessing
        const _preprocessedQuery = this.query
            .replace(/\s+/g, ' ')
            .replace(/,\s*,/g, ',') // Remove duplicate commas
            .trim();
        
        // Continue with normal parsing...
        const clause = this.extractClause(/set\s+(.*?)$/i);
        if (!clause) return {};
        
        const result: Record<string, string> = {};
        clause.content.split(',').forEach(assignment => {
            const [key, value] = assignment.split('=').map(s => s.trim());
            if (key && value) {
                result[key] = value;
            }
        });
        
        return result;
    }
}

/**
 * BEST PRACTICES
 * 
 * 1. NAMING CONVENTIONS:
 *    - Parser classes: [ClauseName]Parser (e.g., OrderByParser, LimitParser)
 *    - Public getters: [ClauseName]Values (e.g., OrderByValues, LimitValues)
 *    - Return types: [ClauseName]Values (e.g., OrderByValues, LimitValues)
 * 
 * 2. ERROR HANDLING:
 *    - Use extractClause() error parameter for required clauses
 *    - Return empty arrays/objects for optional clauses
 *    - Throw descriptive errors for malformed content
 * 
 * 3. REGEX PATTERNS:
 *    - Always use case-insensitive flag (/i)
 *    - Use SqlUtils.createTerminatorPattern() for consistent clause boundaries
 *    - Use SqlUtils.createOperatorPattern() for operator matching
 * 
 * 4. RETURN TYPES:
 *    - Use arrays for multiple items (columns, conditions, etc.)
 *    - Use objects for single complex items
 *    - Use optional properties for nullable values
 * 
 * 5. TESTING:
 *    - Test with various SQL clause orders
 *    - Test with optional clauses present/absent
 *    - Test edge cases (empty strings, malformed SQL)
 *    - Test case sensitivity
 */

/**
 * AVAILABLE UTILITIES
 * 
 * BaseParser provides:
 * - normalizeQuery(): Cleans up whitespace and formatting
 * - extractClause(): Extracts SQL clause content with error handling
 * - Values property: Stores the parsed result
 * 
 * SqlUtils provides:
 * - createTerminatorPattern(): Regex pattern for SQL clause terminators
 * - createOperatorPattern(): Regex pattern for SQL operators
 * - parseTableWithAlias(): Parses "table AS alias" patterns
 * - splitByLogicalOperators(): Splits conditions by AND/OR
 * 
 * CLAUSE_TERMINATORS: WHERE, GROUP BY, ORDER BY, LIMIT, HAVING, UNION, JOINs
 * OPERATORS: =, !=, <>, <, <=, >, >=, LIKE, IN, IS NULL, IS NOT NULL
 * AGGREGATE_FUNCTIONS: COUNT, SUM, AVG, MIN, MAX, UPPER, LOWER, etc.
 */

export default {
    OrderByParser,
    LimitParser,
    HavingParser,
    ValidatedParser,
    PreprocessedParser
};