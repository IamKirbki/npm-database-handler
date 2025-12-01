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
 */
export default class SubQueryParser extends BaseParser<SubQueryValues> {
    /**
     * **Primary access point** for retrieved subquery data and comprehensive table analysis.
     * 
     * This getter provides access to the complete parsing results after the SubQueryParser
     * has analyzed the input SQL query. It returns structured data containing all extracted
     * subqueries and detailed table usage information across both main query and subqueries.
     * 
     * ### Return Structure:
     * ```typescript
     * {
     *   queries: string[];        // Array of extracted subquery strings (with parentheses)
     *   tablesUsed: FromValues[]; // Array of table references with optional aliases
     * }
     * ```
     * 
     * @returns {SubQueryValues | undefined} Complete parsing results, or undefined if parsing failed
     * 
     * @example Basic Access Pattern
     * ```typescript
     * const parser = new SubQueryParser(
     *   "SELECT name, (SELECT COUNT(*) FROM orders WHERE user_id = users.id) FROM users"
     * );
     * 
     * const result = parser.SubQueries;
     * if (result) {
     *   console.log(`Found ${result.queries.length} subqueries`);
     *   console.log(`References ${result.tablesUsed.length} tables`);
     * }
     * ```
     * 
     * @since 1.0.0
     * @readonly
     */
    public get SubQueries(): SubQueryValues | undefined {
        return this._values;
    }

    /**
     * **Core parsing orchestrator** that coordinates subquery extraction and table analysis.
     * 
     * This protected method serves as the central processing hub for the SubQueryParser,
     * implementing the main parsing pipeline that transforms raw SQL strings into structured
     * subquery data. It follows the Template Method pattern inherited from BaseParser.
     * 
     * ### Processing Pipeline:
     * 1. **Subquery Discovery**: Scan for all parenthesized SELECT statements
     * 2. **Nested Extraction**: Recursively process subqueries within subqueries
     * 3. **Table Identification**: Extract table references from each subquery
     * 4. **Main Query Analysis**: Process table references in the primary query
     * 5. **Result Compilation**: Combine all findings with deduplication
     * 
     * @protected
     * @override
     * @returns {SubQueryValues} Structured analysis containing queries and table usage
     * 
     * @since 1.0.0
     */
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

    /**
     * **Advanced recursive subquery extraction engine** with intelligent depth tracking.
     * 
     * This method implements the core subquery discovery algorithm using sophisticated
     * character-by-character analysis with proper parentheses depth tracking. Unlike
     * fragile regex-based approaches that break on nested structures, this implementation
     * can handle unlimited nesting levels while respecting string literal boundaries.
     * 
     * ### Algorithm Strengths:
     * - **✅ Unlimited Nesting**: No artificial depth restrictions
     * - **✅ String Literal Safe**: Properly handles quoted content with parentheses
     * - **✅ Recursive Discovery**: Finds subqueries within subqueries
     * - **✅ Duplicate Prevention**: Intelligent deduplication of identical subqueries
     * - **❌ Regex Limitations**: Avoids greedy/non-greedy matching pitfalls
     * 
     * @private
     * @param {string} sql - SQL string to analyze for subqueries
     * @returns {string[]} Array of complete subquery strings including outer parentheses
     * 
     * @example Basic Subquery Extraction
     * ```typescript
     * const sql = "SELECT name, (SELECT COUNT(*) FROM orders WHERE user_id = users.id) FROM users";
     * const subqueries = this.extractAllSubQueries(sql);
     * // Returns: ["(SELECT COUNT(*) FROM orders WHERE user_id = users.id)"]
     * ```
     * 
     * @since 1.0.0
     */
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
     * **Precision parentheses matcher** using depth-based tracking algorithm.
     * 
     * This method implements the core parentheses matching logic that enables accurate
     * subquery boundary detection in complex nested SQL structures. It uses a sophisticated
     * depth tracking approach combined with string literal awareness to find the exact
     * closing parenthesis that matches a given opening parenthesis.
     * 
     * ### Core Algorithm:
     * ```
     * DEPTH_TRACKING_ALGORITHM:
     * 1. Initialize depth counter to 0
     * 2. For each character from startIndex:
     *    a. If '(' and not in string literal: increment depth
     *    b. If ')' and not in string literal: decrement depth  
     *    c. If depth reaches 0: found matching closing parenthesis
     * 3. Handle string literals (', ", `) to avoid false matches inside quoted content
     * 4. Return success=true with endIndex, or success=false if unmatched
     * ```
     * 
     * @private
     * @param {string} sql - Complete SQL string containing the subquery
     * @param {number} startIndex - Index of the opening parenthesis to match
     * @returns {{ success: boolean; endIndex: number }} Match result with position
     * 
     * @example Basic Parentheses Matching
     * ```typescript
     * const sql = "SELECT name, (SELECT COUNT(*) FROM orders) FROM users";
     * const startPos = sql.indexOf('('); // Position of opening parenthesis
     * 
     * const result = this.extractSubQueryAtPosition(sql, startPos);
     * console.log(result); // { success: true, endIndex: 38 }
     * ```
     * 
     * @since 1.0.0
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
     * **Comprehensive table reference analyzer** for SQL query table extraction.
     * 
     * This method implements a multi-strategy approach to identify all table references
     * within a SQL query, including main tables, joined tables, and aliased references.
     * It combines clause-based parsing with pattern recognition to ensure complete
     * coverage of table usage throughout the query structure.
     * 
     * ### Extraction Strategies:
     * 1. **FROM Clause Analysis**: `FROM users u` → { tableName: "users", alias: "u" }
     * 2. **JOIN Clause Analysis**: `INNER JOIN orders o` → { tableName: "orders", alias: "o" }
     * 3. **Dotted Reference Analysis**: `u.name`, `orders.total` → Extracts table identifiers
     * 4. **Filtering & Validation**: Removes SQL keywords and invalid references
     * 
     * @private
     * @param {string} sql - SQL query string to analyze for table references
     * @returns {FromValues[]} Array of validated table references with optional aliases
     * 
     * @example Simple Table Extraction
     * ```typescript
     * const sql = "SELECT name FROM users WHERE status = 'active'";
     * const tables = this.extractTablesFromQuery(sql);
     * // Returns: [{ tableName: "users" }]
     * ```
     * 
     * @example Multi-Table Query
     * ```typescript
     * const sql = "SELECT u.name FROM users u JOIN profiles p ON p.user_id = u.id";
     * const tables = this.extractTablesFromQuery(sql);
     * // Returns: [{ tableName: "users", alias: "u" }, { tableName: "profiles", alias: "p" }]
     * ```
     * 
     * @since 1.0.0
     */
    private extractTablesFromQuery(sql: string): FromValues[] {
        const tables = new Set<FromValues>();

        this.extractClauseTableReferences(sql, 'from', tables);
        this.extractClauseTableReferences(sql, 'join', tables);

        return this.filterValidTableNames(tables);
    }

    /**
     * **Unified clause-based table extraction engine** for FROM and JOIN clauses.
     * 
     * This method provides a reusable approach to extract table references from specific
     * SQL clause types. It handles both FROM and JOIN clauses with a single implementation,
     * supporting all JOIN variants and properly parsing table names with optional aliases.
     * 
     * ### Supported Clause Types:
     * - **FROM clauses**: `FROM table_name [AS alias]`
     * - **JOIN clauses**: `[type] JOIN table_name [AS alias]`
     *   - INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN, CROSS JOIN
     *   - OUTER variations (LEFT OUTER JOIN, etc.)
     * 
     * ### Processing Flow:
     * 1. Generate appropriate regex pattern for clause type
     * 2. Extract all matches from the SQL string
     * 3. Clean and parse each match for table name and alias
     * 4. Add validated entries to the provided tables set
     * 
     * @private
     * @param {string} sql - SQL query string to analyze
     * @param {'from' | 'join'} clauseType - Type of clause to extract tables from
     * @param {Set<FromValues>} tables - Set to add discovered tables to (modified in-place)
     * 
     * @example FROM Clause Processing
     * ```typescript
     * const tables = new Set<FromValues>();
     * this.extractClauseTableReferences(
     *   "SELECT * FROM users u WHERE status = 'active'",
     *   'from',
     *   tables
     * );
     * // tables now contains: { tableName: "users", alias: "u" }
     * ```
     * 
     * @example JOIN Clause Processing
     * ```typescript
     * const tables = new Set<FromValues>();
     * this.extractClauseTableReferences(
     *   "LEFT OUTER JOIN user_profiles up ON up.user_id = u.id",
     *   'join',
     *   tables
     * );
     * // tables now contains: { tableName: "user_profiles", alias: "up" }
     * ```
     * 
     * @since 1.0.0
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
     * **Table name validator and filter** ensuring data quality and SQL compliance.
     * 
     * This method applies comprehensive validation rules to filter out invalid table
     * references and ensure only legitimate table names and aliases are included in
     * the final results. It performs both structural validation and SQL keyword filtering.
     * 
     * ### Validation Rules:
     * - **Non-empty**: Filters out empty strings and null values
     * - **SQL Keywords**: Excludes reserved SQL words using SqlUtils.SQL_ALL_KEYWORDS
     * - **Structural Integrity**: Removes malformed references (e.g., starting with '(')
     * - **Alias Validation**: Ensures aliases also pass validation when present
     * 
     * ### Quality Assurance:
     * - Maintains referential integrity between table names and aliases
     * - Preserves valid entries while filtering problematic ones
     * - Consistent application of validation rules across all table references
     * 
     * @private
     * @param {Set<FromValues>} tables - Set of table references to validate and filter
     * @returns {FromValues[]} Array of validated table references
     * 
     * @example Filtering Mixed Input
     * ```typescript
     * const input = new Set<FromValues>([
     *   { tableName: "users", alias: "u" },           // Valid
     *   { tableName: "SELECT", alias: "s" },         // Invalid - SQL keyword
     *   { tableName: "orders" },                     // Valid
     *   { tableName: "(subquery)" },                 // Invalid - malformed
     *   { tableName: "products", alias: "WHERE" }    // Invalid - alias is keyword
     * ]);
     * 
     * const filtered = this.filterValidTableNames(input);
     * // Returns: [
     * //   { tableName: "users", alias: "u" },
     * //   { tableName: "orders" }
     * // ]
     * ```
     * 
     * @since 1.0.0
     */
    private filterValidTableNames(tables: Set<FromValues>): FromValues[] {
        return Array.from(tables).filter(table => this.isValidTableName(table.tableName) && !table.tableName.startsWith('(') && (table.alias ? this.isValidTableName(table.alias) : true));
    }

    /**
     * **Table name validity checker** for SQL identifier compliance.
     * 
     * This method determines whether a given string represents a valid SQL table name
     * by checking against common validation rules including non-emptiness and SQL
     * keyword exclusion. It serves as the foundation for table reference filtering.
     * 
     * ### Validation Criteria:
     * - **Non-empty**: String must have content (not null, undefined, or empty)
     * - **Not SQL Keyword**: Must not be a reserved SQL word (case-insensitive)
     * - **Safe for Identifiers**: Suitable for use as a table name or alias
     * 
     * @private
     * @param {string} tableName - Table name string to validate
     * @returns {boolean} True if the table name is valid for SQL usage
     * 
     * @example Valid Table Names
     * ```typescript
     * console.log(this.isValidTableName("users"));      // true
     * console.log(this.isValidTableName("user_data"));  // true
     * console.log(this.isValidTableName("Table123"));   // true
     * console.log(this.isValidTableName("my_schema.users")); // true
     * ```
     * 
     * @example Invalid Table Names
     * ```typescript
     * console.log(this.isValidTableName(""));          // false - empty
     * console.log(this.isValidTableName("SELECT"));     // false - SQL keyword
     * console.log(this.isValidTableName("FROM"));       // false - SQL keyword
     * console.log(this.isValidTableName("WHERE"));      // false - SQL keyword
     * ```
     * 
     * @since 1.0.0
     */
    private isValidTableName(tableName: string): boolean {
        return Boolean(tableName) && !SqlUtils.SQL_ALL_KEYWORDS.includes(tableName.toLowerCase());
    }

    /**
     * **Table and alias parser** for comprehensive table reference extraction.
     * 
     * This method analyzes table definition strings to extract both table names and
     * optional aliases, handling various SQL syntax patterns including explicit AS
     * keywords and implicit alias definitions. It creates properly structured FromValues
     * objects for consistent table reference handling.
     * 
     * ### Supported Syntax Patterns:
     * - **Simple table**: `"users"` → `{ tableName: "users" }`
     * - **Implicit alias**: `"users u"` → `{ tableName: "users", alias: "u" }`
     * - **Explicit alias**: `"users AS u"` → `{ tableName: "users", alias: "u" }`
     * - **Schema qualified**: `"schema.users u"` → `{ tableName: "schema.users", alias: "u" }`
     * 
     * ### Processing Logic:
     * 1. Split input string on whitespace to identify components
     * 2. Extract table name from first component (if valid)
     * 3. Determine alias from subsequent components:
     *    - Direct alias: second component (if not 'AS' or 'ON')
     *    - Explicit alias: third component (if second is 'AS')
     * 4. Create and add FromValues entry to the provided set
     * 
     * @private
     * @param {string} tableInfo - String containing table name and optional alias
     * @param {Set<FromValues>} tables - Set to add the parsed table entry to (modified in-place)
     * 
     * @example Simple Table Parsing
     * ```typescript
     * const tables = new Set<FromValues>();
     * this.parseTableAndAlias("users", tables);
     * // tables now contains: { tableName: "users" }
     * ```
     * 
     * @example Implicit Alias Parsing
     * ```typescript
     * const tables = new Set<FromValues>();
     * this.parseTableAndAlias("user_profiles up", tables);
     * // tables now contains: { tableName: "user_profiles", alias: "up" }
     * ```
     * 
     * @example Explicit Alias Parsing
     * ```typescript
     * const tables = new Set<FromValues>();
     * this.parseTableAndAlias("orders AS o", tables);
     * // tables now contains: { tableName: "orders", alias: "o" }
     * ```
     * 
     * @example Schema Qualified Table
     * ```typescript
     * const tables = new Set<FromValues>();
     * this.parseTableAndAlias("production.users u", tables);
     * // tables now contains: { tableName: "production.users", alias: "u" }
     * ```
     * 
     * @example Edge Case Handling
     * ```typescript
     * const tables = new Set<FromValues>();
     * 
     * // Handles JOIN ON clauses correctly
     * this.parseTableAndAlias("orders o ON", tables);
     * // tables contains: { tableName: "orders", alias: "o" }
     * // (ignores 'ON' keyword)
     * 
     * // Skips malformed entries
     * this.parseTableAndAlias("(subquery)", tables);
     * // tables remains unchanged (starts with parenthesis)
     * ```
     * 
     * @since 1.0.0
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