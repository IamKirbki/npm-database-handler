/**
 * Abstract base class for SQL clause parsers implementing the Template Method pattern.
 * 
 * This class provides common functionality for parsing SQL query clauses while allowing
 * specific parsers to implement their own parsing logic. It handles query normalization,
 * common clause extraction patterns, and result caching.
 * 
 * The class follows the Template Method design pattern where the overall parsing workflow
 * is defined in the base class, but specific parsing implementation is delegated to subclasses.
 * 
 * @template T - The type of values returned by the parser (e.g., FromValues[], WhereValues[])
 * 
 * @example
 * ```typescript
 * class MyParser extends BaseParser<MyValues[]> {
 *   protected parse(): MyValues[] {
 *     const clause = this.extractClause(/my_clause\s+(.*?)$/i);
 *     if (!clause) return [];
 *     // Parse the clause content and return results
 *     return [{ value: clause.content }];
 *   }
 * }
 * 
 * const parser = new MyParser("SELECT * FROM table MY_CLAUSE some_value");
 * const results = parser.Values; // Returns parsed values or undefined
 * ```
 * 
 * @see {@link FromParser} Example implementation for FROM clauses
 * @see {@link WhereParser} Example implementation for WHERE clauses
 * @see {@link JoinParser} Example implementation for JOIN clauses
 */
export abstract class BaseParser<T> {
    /**
     * The normalized SQL query string used for parsing.
     * 
     * This property contains the SQL query after normalization (whitespace cleanup,
     * newline removal, etc.). It's the query that all parsing operations work against.
     * 
     * @protected
     * @readonly
     */
    protected readonly query: string;
    
    /**
     * Cached parsed values from the SQL query.
     * 
     * This property stores the result of the parsing operation. It's populated
     * once during construction and cached for subsequent access through the Values getter.
     * 
     * @protected
     */
    protected _values?: T;
    
    /**
     * Gets the parsed values from the SQL query.
     * 
     * Returns the parsed values if parsing was successful, or undefined if parsing
     * failed or no matching clause was found. The values are cached after the first
     * parse operation.
     * 
     * @returns The parsed values or undefined if parsing failed
     * 
     * @example
     * ```typescript
     * const parser = new FromParser("SELECT * FROM users WHERE id = 1");
     * const fromValues = parser.Values;
     * if (fromValues) {
     *   console.log(fromValues[0].tableName); // "users"
     * }
     * ```
     */
    public get Values(): T | undefined {
        return this._values;
    }

    /**
     * Creates a new parser instance and immediately parses the provided SQL query.
     * 
     * The constructor normalizes the input query and triggers the parsing process.
     * Parsing results are cached and accessible via the Values property.
     * 
     * @param query - The SQL query string to parse
     * 
     * @example
     * ```typescript
     * // Create a parser - parsing happens immediately
     * const parser = new WhereParser("SELECT * FROM users WHERE age > 18");
     * 
     * // Access results
     * const conditions = parser.Values;
     * ```
     */
    constructor(query: string) {
        this.query = this.normalizeQuery(query);
        this._values = this.parse();
    }

    /**
     * Normalizes a SQL query string for consistent parsing.
     * 
     * Performs standardization operations on the input query:
     * - Removes newlines and converts them to spaces
     * - Trims whitespace from each line
     * - Collapses multiple consecutive spaces into single spaces
     * - Trims leading and trailing whitespace
     * 
     * @param query - The raw SQL query string to normalize
     * @returns The normalized query string
     * 
     * @example
     * ```typescript
     * const rawQuery = `
     *   SELECT   *
     *   FROM     users
     *   WHERE    age > 18
     * `;
     * const normalized = parser.normalizeQuery(rawQuery);
     * // Returns: "SELECT * FROM users WHERE age > 18"
     * ```
     */
    protected normalizeQuery(query: string): string {
        return query.split('\n').map(line => line.trim()).join(' ').replace(/\s+/g, ' ').trim();
    }

    /**
     * Abstract method that subclasses must implement to define specific parsing logic.
     * 
     * This method is called during construction and should contain the specific
     * parsing implementation for the SQL clause type. It should return the parsed
     * values or an appropriate default/empty value if parsing fails.
     * 
     * @returns The parsed values of type T
     * 
     * @example
     * ```typescript
     * protected parse(): WhereValues[] {
     *   const clause = this.extractClause(/where\s+(.*?)$/i);
     *   if (!clause) return [];
     *   
     *   // Parse conditions from clause.content
     *   return this.parseConditions(clause.content);
     * }
     * ```
     */
    protected abstract parse(): T;

    /**
     * Extracts a specific SQL clause using a regular expression pattern.
     * 
     * This utility method applies a regex pattern to the normalized query and extracts
     * the matching clause content. Optionally throws an error if the clause is required
     * but not found.
     * 
     * @param pattern - Regular expression to match the desired clause
     * @param errorMessage - Optional error message to throw if clause is not found
     * @returns Object containing extracted content and full match, or null if not found
     * @throws Error when errorMessage is provided and no match is found
     * 
     * @example
     * ```typescript
     * // Extract WHERE clause content
     * const whereClause = this.extractClause(/where\s+(.*?)(?=\s+order\s+by|\s+limit|;|$)/i);
     * if (whereClause) {
     *   console.log(whereClause.content); // "age > 18 AND status = 'active'"
     *   console.log(whereClause.fullMatch); // "WHERE age > 18 AND status = 'active'"
     * }
     * 
     * // Extract required clause with error handling
     * const fromClause = this.extractClause(
     *   /from\s+(.*?)$/i, 
     *   "Invalid SQL query: FROM clause not found."
     * );
     * // Throws error if FROM clause is missing
     * ```
     */
    protected extractClause(
        pattern: RegExp, 
        errorMessage?: string
    ): { content: string; fullMatch: string } | null {
        const match = this.query.match(pattern);
        if (!match || match.length < 2) {
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            return null;
        }
        return {
            content: match[1].trim(),
            fullMatch: match[0]
        };
    }
}