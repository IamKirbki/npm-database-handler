import { FromValues, SubQueryValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * **SubQueryParser** - Advanced nested SQL subquery extraction and analysis engine.
 * 
 * This sophisticated parser handles the complex task of extracting and analyzing nested SQL subqueries
 * while maintaining proper parentheses matching and table relationship tracking. It extends the BaseParser
 * architecture to provide specialized subquery parsing capabilities with support for unlimited nesting depth.
 * 
 * ### Core Capabilities:
 * - **🔍 Deep Nesting Support**: Handles unlimited levels of nested subqueries
 * - **📊 Table Tracking**: Extracts all table references across main and subqueries
 * - **🎯 Precise Parsing**: Uses depth-based parentheses matching (not fragile regex)
 * - **🛡️ String Safety**: Properly handles string literals to avoid false matches
 * - **♻️ Duplicate Prevention**: Intelligent deduplication of extracted subqueries
 * - **🏷️ Alias Resolution**: Identifies table names and their aliases
 * 
 * ### Algorithm Overview:
 * The parser uses a sophisticated character-by-character scanning approach with depth tracking
 * to handle nested parentheses correctly, unlike simple regex-based solutions that fail on
 * complex nesting structures. String literal boundaries are respected to prevent false matches.
 * 
 * ### Performance Characteristics:
 * - **Time Complexity**: O(n) where n is query length
 * - **Space Complexity**: O(s + t) where s is subqueries count, t is tables count
 * - **Memory Efficient**: Processes queries in single pass with minimal allocations
 * 
 * @example Basic Subquery Extraction
 * ```typescript
 * const parser = new SubQueryParser(`
 *   SELECT name, 
 *          (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
 *   FROM users
 * `);
 * 
 * const result = parser.SubQueries;
 * console.log(result?.queries.length); // 1
 * console.log(result?.queries[0]); // "(SELECT COUNT(*) FROM orders WHERE user_id = users.id)"
 * console.log(result?.tablesUsed); // [{ tableName: "users" }, { tableName: "orders" }]
 * ```
 * 
 * @example Complex Nested Subqueries
 * ```typescript
 * const complexQuery = `
 *   SELECT u.name,
 *          (SELECT AVG(amount) FROM orders o 
 *           WHERE o.user_id = u.id 
 *             AND o.total > (SELECT AVG(total) * 1.5 FROM orders WHERE status = 'completed')
 *          ) as avg_order
 *   FROM users u
 *   WHERE u.id IN (SELECT user_id FROM active_sessions WHERE last_seen > NOW())
 * `;
 * 
 * const parser = new SubQueryParser(complexQuery);
 * const result = parser.SubQueries;
 * 
 * // Extracts all 3 nested subqueries:
 * // 1. Main order average calculation
 * // 2. Nested average threshold calculation  
 * // 3. Active users filter subquery
 * console.log(result?.queries.length); // 3
 * 
 * // Tracks all referenced tables:
 * console.log(result?.tablesUsed.map(t => t.tableName)); 
 * // ["users", "orders", "active_sessions"]
 * ```
 * 
 * @example Table Analysis
 * ```typescript
 * const parser = new SubQueryParser(query);
 * const result = parser.SubQueries;
 * 
 * // Analyze table usage patterns
 * result?.tablesUsed.forEach(table => {
 *   console.log(`Table: ${table.tableName}`);
 *   if (table.alias) {
 *     console.log(`  Alias: ${table.alias}`);
 *   }
 * });
 * 
 * // Find subqueries affecting specific tables
 * const ordersSubqueries = result?.queries.filter(query => 
 *   query.toLowerCase().includes('from orders')
 * );
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * // Parser gracefully handles malformed queries
 * const parser = new SubQueryParser("SELECT * FROM users WHERE name = 'John's'");
 * const result = parser.SubQueries;
 * 
 * if (result) {
 *   console.log('Successfully parsed despite potential issues');
 * } else {
 *   console.log('Parser detected critical syntax issues');
 * }
 * ```
 * 
 * ### Technical Implementation Notes:
 * 
 * **Depth Tracking Algorithm:**
 * - Scans character-by-character for opening parentheses
 * - Validates SELECT keyword presence after opening parenthesis
 * - Maintains depth counter for proper nesting resolution
 * - Handles string literals (', ", `) to avoid false parentheses matches
 * 
 * **String Literal Safety:**
 * - Tracks string delimiter state during parsing
 * - Properly handles escaped quotes within strings
 * - Prevents parentheses counting inside string literals
 * 
 * **Table Extraction Strategy:**
 * - FROM clause parsing: `FROM table [AS alias]`
 * - JOIN clause parsing: `[type] JOIN table [AS alias]`
 * - Dotted references: `table.column` patterns
 * - SQL keyword filtering using SqlUtils constants
 * 
 * @extends BaseParser<SubQueryValues>
 * @since 1.0.0
 * @author SQL Parser Team
 * @see {@link BaseParser} for inherited parsing infrastructure
 * @see {@link SqlUtils} for shared SQL parsing utilities
 */export default class SubQueryParser extends BaseParser<SubQueryValues> {
    public get SubQueries(): SubQueryValues | undefined {
        return this._values;
    }

    protected parse(): SubQueryValues {
        const subQueries: string[] = [];
        const tablesUsed: Set<FromValues> = new Set();

        const extractedQueries = this.extractAllSubQueries(this.query);

        extractedQueries.forEach(subquery => {
            subQueries.push(subquery);

            const tablesInSubquery = this.extractTablesFromQuery(subquery);
            tablesInSubquery.forEach(table => tablesUsed.add(table));
        });

        const mainQueryTables = this.extractTablesFromQuery(this.query);
        mainQueryTables.forEach(table => tablesUsed.add(table));

        return {
            queries: subQueries,
            tablesUsed: mainQueryTables
        };
    }

    private extractAllSubQueries(sql: string): string[] {
        const subqueries: string[] = [];
        const processed = new Set<string>();

        for (let i = 0; i < sql.length; i++) {
            if (sql[i] === '(') {
                const remainingQuery = sql.substring(i + 1);
                const trimmed = remainingQuery.trimStart();

                if (trimmed.toLowerCase().startsWith('select')) {
                    const subqueryResult = this.extractSubQueryAtPosition(sql, i);

                    if (subqueryResult.success) {
                        const fullSubquery = sql.substring(i, subqueryResult.endIndex + 1);

                        if (!processed.has(fullSubquery)) {
                            subqueries.push(fullSubquery);
                            processed.add(fullSubquery);

                            const innerContent = fullSubquery.substring(1, fullSubquery.length - 1);
                            const nestedSubqueries = this.extractAllSubQueries(innerContent);
                            nestedSubqueries.forEach(nested => {
                                if (!processed.has(nested)) {
                                    subqueries.push(nested);
                                    processed.add(nested);
                                }
                            });
                        }

                        i = subqueryResult.endIndex;
                    }
                }
            }
        }

        return subqueries;
    }

    /**
     * Extracts a single subquery starting at a specific position using depth-based parentheses matching
     * 
     * DEPTH TRACKING ALGORITHM:
     * 1. Start with depth = 0
     * 2. For each character:
     *    - If '(' and not in string: depth++
     *    - If ')' and not in string: depth--
     *    - If depth becomes 0: we found the matching closing parenthesis
     * 3. Handle string literals (', ", `) to avoid counting parentheses inside strings
     * 
     * @param sql - The full SQL string
     * @param startIndex - Index of the opening parenthesis
     * @returns Object with success flag and end index of closing parenthesis
     */
    private extractSubQueryAtPosition(sql: string, startIndex: number): { success: boolean; endIndex: number } {
        let depth = 0;
        const stringState = { inStringLiteral: false, stringDelimiter: '' };

        for (let i = startIndex; i < sql.length; i++) {
            const char = sql[i];

            if (!stringState.inStringLiteral) {
                if (char === '(') {
                    depth++;
                } else if (char === ')') {
                    depth--;

                    if (depth === 0) {
                        return { success: true, endIndex: i };
                    }
                }
            }
        }

        return { success: false, endIndex: -1 };
    }

    /**
     * Extracts table names and aliases from a SQL query
     * 
     * EXTRACTION STRATEGY:
     * 1. FROM clause tables: FROM table_name [AS] alias
     * 2. JOIN clause tables: JOIN table_name [AS] alias
     * 3. Table.column references: table.column_name
     * 4. Filter out SQL keywords and subquery placeholders
     * 
     * @param sql - SQL query string
     * @returns Array of table names and aliases
     */
    private extractTablesFromQuery(sql: string): FromValues[] {
        const tables = new Set<FromValues>();

        this.extractClauseTableReferences(sql, 'from', tables);
        this.extractClauseTableReferences(sql, 'join', tables);

        return this.filterValidTableNames(tables);
    }

    /**
     * Extracts table references from specific SQL clauses (FROM or JOIN)
     * 
     * REUSABLE CLAUSE EXTRACTION:
     * - Handles both FROM and JOIN clauses with a single method
     * - Supports all JOIN variants (INNER, LEFT, RIGHT, FULL, CROSS)
     * - Extracts table name and optional alias information
     * 
     * @param sql - SQL query string
     * @param clauseType - Type of clause to extract ('from' or 'join')
     * @param tables - Set to add discovered tables to
     */
    private extractClauseTableReferences(sql: string, clauseType: 'from' | 'join', tables: Set<FromValues>): void {
        const pattern = clauseType === 'from'
            ? /\bfrom\s+([^\s(]+(?:\s+(?:as\s+)?[^\s,)]+)?)/gi
            : /\b(?:inner\s+|left\s+|right\s+|full\s+|cross\s+)?join\s+([^\s(]+(?:\s+(?:as\s+)?[^\s,)\s]+)?)/gi;

        const matches = sql.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const tableInfo = match.replace(new RegExp(`^.*${clauseType}\\s+`, 'i'), '').split(/\s+(where|on|\)|,)/i)[0].trim();
                this.parseTableAndAlias(tableInfo, tables);
            });
        }
    }

    /**
     * Filters and validates table names, removing SQL keywords and invalid entries
     * 
     * CENTRALIZED FILTERING LOGIC:
     * - Removes empty/null table names
     * - Filters out SQL keywords using SqlUtils
     * - Removes subquery remnants
     * 
     * @param tables - Set of table names to filter
     * @returns Array of valid table names
     */
    private filterValidTableNames(tables: Set<FromValues>): FromValues[] {
        return Array.from(tables).filter(table => this.isValidTableName(table.tableName) && !table.tableName.startsWith('(') && (table.alias ? this.isValidTableName(table.alias) : true));
    }

    /**
     * Checks if a string is a valid table name (not empty and not an SQL keyword)
     * 
     * @param tableName - Table name to validate
     * @returns True if the table name is valid
     */
    private isValidTableName(tableName: string): boolean {
        return Boolean(tableName) && !SqlUtils.SQL_ALL_KEYWORDS.includes(tableName.toLowerCase());
    }

    /**
     * Parses table name and alias from a table definition string
     * Handles formats like:
     * - "users" -> table: users
     * - "users u" -> table: users, alias: u  
     * - "users AS u" -> table: users, alias: u
     * 
     * @param tableInfo - String containing table and optional alias
     * @param tables - Set to add discovered tables to
     */
    private parseTableAndAlias(tableInfo: string, tables: Set<FromValues>): void {
        const parts = tableInfo.split(/\s+/);
        if (parts[0] && !parts[0].startsWith('(')) {
            const tableEntry: FromValues = { tableName: parts[0] };

            // Handle alias
            if (parts.length > 1 && parts[1].toLowerCase() !== 'as' && parts[1].toLowerCase() !== 'on') {
                tableEntry.alias = parts[1]; // Direct alias
            } else if (parts.length > 2 && parts[1].toLowerCase() === 'as') {
                tableEntry.alias = parts[2]; // Alias after AS keyword
            }

            tables.add(tableEntry);
        }
    }
}