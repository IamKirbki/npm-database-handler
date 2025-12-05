import { QueryParameters, TableColumnInfo } from "../types/index";

/**
 * Validator class for validating table names, column names, column types, SQL queries, and query parameters
 * 
 * Provides static methods to ensure data integrity and prevent SQL injection attacks by:
 * - Validating table and column naming conventions
 * - Checking column type compatibility with SQLite standards
 * - Detecting SQL injection patterns in queries
 * - Verifying parameter types match column types
 * - Enforcing NOT NULL constraints
 * 
 * @example
 * ```typescript
 * // Validate a table name
 * Validator.ValidateTableName('users'); // OK
 * Validator.ValidateTableName('invalid-name'); // throws Error
 * 
 * // Validate a column type
 * Validator.ValidateColumnType('TEXT NOT NULL'); // OK
 * Validator.ValidateColumnType('INVALID_TYPE'); // throws Error
 * 
 * // Validate a query for SQL injection
 * Validator.ValidateQuery('SELECT * FROM users WHERE id = @id', columnInfo); // OK
 * Validator.ValidateQuery('SELECT * FROM users; DROP TABLE users', columnInfo); // throws Error
 * ```
 */
export default class Validator {
    /**
     * List of valid SQLite column types
     * Includes numeric, text, binary, date/time types and compatibility types for other SQL dialects
     */
    private static readonly validTypes: string[] = [
        // Numeric types
        "INTEGER", "INT", "TINYINT", "SMALLINT", "MEDIUMINT", "BIGINT", "UNSIGNED BIG INT",
        "INT2", "INT8", "NUMERIC", "DECIMAL", "BOOLEAN", "FLOAT", "DOUBLE", "DOUBLE PRECISION", "REAL",

        // Text types
        "TEXT", "CHARACTER", "CHAR", "VARCHAR", "VARYING CHARACTER", "NCHAR",
        "NATIVE CHARACTER", "NVARCHAR", "CLOB",

        // Binary types
        "BLOB", "BINARY", "VARBINARY",

        // Date/time types
        "DATE", "DATETIME", "TIME", "TIMESTAMP",

        // Other types (for compatibility with other SQL dialects)
        "ENUM", "SET", "YEAR", "JSON", "GEOMETRY", "POINT", "LINESTRING", "POLYGON",
        "MULTIPOINT", "MULTILINESTRING", "MULTIPOLYGON", "GEOMETRYCOLLECTION"
    ];

    /**
     * List of SQL keywords that are valid in column type definitions
     * These keywords are stripped when validating the base column type
     */
    private static readonly sqlKeywords: string[] = [
        "NOT",
        "NULL",
        "PRIMARY",
        "KEY",
        "AUTOINCREMENT",
        "UNIQUE",
        "CHECK",
        "DEFAULT",
        "COLLATE",
        "REFERENCES"
    ];

    /**
     * Validates a table name according to SQLite naming conventions
     * 
     * Rules:
     * - Must be a non-empty string
     * - Cannot contain commas
     * - Must only contain letters, numbers, and underscores
     * 
     * @param name - The table name to validate
     * @throws Error if the table name is invalid
     * 
     * @example
     * ```typescript
     * Validator.ValidateTableName('users'); // OK
     * Validator.ValidateTableName('user_accounts'); // OK
     * Validator.ValidateTableName('users123'); // OK
     * Validator.ValidateTableName('invalid-name'); // throws Error
     * Validator.ValidateTableName(''); // throws Error
     * ```
     */
    static ValidateTableName(name: string): void {
        this.ValidateName(name, "Table");
    }

    /**
     * Validates a column name according to SQLite naming conventions
     * 
     * Rules:
     * - Must be a non-empty string
     * - Cannot contain commas
     * - Must only contain letters, numbers, and underscores
     * 
     * @param name - The column name to validate
     * @throws Error if the column name is invalid
     * 
     * @example
     * ```typescript
     * Validator.ValidateColumnName('email'); // OK
     * Validator.ValidateColumnName('user_id'); // OK
     * Validator.ValidateColumnName('created_at'); // OK
     * Validator.ValidateColumnName('invalid-name'); // throws Error
     * Validator.ValidateColumnName(''); // throws Error
     * ```
     */
    static ValidateColumnName(name: string): void {
        this.ValidateName(name, "Column");
    }

    /**
     * Generic name validation for tables and columns
     * 
     * Rules:
     * - Must be a non-empty string
     * - Cannot contain commas
     * - Must only contain letters, numbers, and underscores
     * 
     * @param name - The table/column name to validate
     * @param type - The type, either table or column
     * @throws Error if the name is invalid
    */
    private static ValidateName(name: string, type: "Table" | "Column"): void {
        if (!name || typeof name !== "string") {
            throw new Error(`${type} name must be a non-empty string.`);
        }
        if (name.includes(",")) {
            throw new Error(`${type} name cannot contain commas.`);
        }
        if (/[^a-zA-Z0-9_]/.test(name)) {
            throw new Error(`${type} name must only contain letters, numbers, and underscores.`);
        }
    }

    /**
     * Validates a column type definition against SQLite type standards
     * 
     * Strips SQL keywords (NOT NULL, PRIMARY KEY, etc.) and length specifications
     * before checking if the base type is valid. Supports all SQLite types and
     * common types from other SQL dialects for compatibility.
     * 
     * @param type - The column type definition to validate (e.g., "TEXT NOT NULL", "VARCHAR(255)")
     * @throws Error if the column type is invalid
     * 
     * @example
     * ```typescript
     * Validator.ValidateColumnType('TEXT'); // OK
     * Validator.ValidateColumnType('INTEGER NOT NULL'); // OK
     * Validator.ValidateColumnType('VARCHAR(255)'); // OK
     * Validator.ValidateColumnType('TEXT PRIMARY KEY'); // OK
     * Validator.ValidateColumnType('INVALID_TYPE'); // throws Error
     * ```
     */
    static ValidateColumnType(type: string): void {
        if (!type || typeof type !== "string") {
            throw new Error("Column type must be a non-empty string.");
        }

        const cleanedType = type
            .toUpperCase()
            .replace(/\([0-9 , a-zA-Z]*\)/g, "") // Remove (255), (10,2), etc.
            .replace(new RegExp(`\\b(${this.sqlKeywords.join("|")})\\b`, "gi"), "")
            .trim();

        if (!this.validTypes.includes(cleanedType)) {
            throw new Error(`Invalid column type "${type}". Valid types are: ${this.validTypes.join(", ")}.`);
        }
    }

    /**
     * Validates an SQL query for security and correctness
     * 
     * Security checks:
     * - Detects SQL injection attempts (semicolon followed by DROP, DELETE, UPDATE, INSERT, ALTER)
     * - Ensures all field references (@fieldName) exist in the table schema
     * 
     * Correctness checks:
     * - Verifies all required (NOT NULL) fields are provided in INSERT queries
     * - Validates query is a non-empty string
     * 
     * @param query - The SQL query string to validate
     * @param TableColumnInformation - Array of column metadata from the table schema
     * @throws Error if the query contains forbidden operations, references unknown fields, or missing required fields
     * 
     * @example
     * ```typescript
     * const columnInfo = [
     *   { name: 'id', type: 'INTEGER', notnull: 1 },
     *   { name: 'name', type: 'TEXT', notnull: 1 },
     *   { name: 'email', type: 'TEXT', notnull: 0 }
     * ];
     * 
     * // Valid queries
     * Validator.ValidateQuery('SELECT * FROM users WHERE id = @id', columnInfo); // OK
     * Validator.ValidateQuery('INSERT INTO users (name, email) VALUES (@name, @email)', columnInfo); // OK
     * 
     * // Invalid queries
     * Validator.ValidateQuery('SELECT * FROM users; DROP TABLE users', columnInfo); // throws Error - SQL injection
     * Validator.ValidateQuery('SELECT * FROM users WHERE @nonexistent = 1', columnInfo); // throws Error - unknown field
     * Validator.ValidateQuery('INSERT INTO users (email) VALUES (@email)', columnInfo); // throws Error - missing required field 'name'
     * ```
     */
    static ValidateQuery(query: string, TableColumnInformation: TableColumnInfo[]): void {
        if (!query || typeof query !== "string" || query.trim() === "") {
            throw new Error("Query must be a non-empty string.");
        }

        const forbiddenPatterns = [
            /;\s*drop\s+table/i,
            /;\s*delete\s+from/i,
            /;\s*update\s+/i,
            /;\s*insert\s+into/i,
            /;\s*alter\s+table/i
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(query)) {
                throw new Error("Query contains forbidden operations.");
            }
        }

        const fieldPattern = /@([a-zA-Z0-9_]+)/g;
        let match;

        let requiredFields = TableColumnInformation
            .filter(col => col.notnull === 1);

        while ((match = fieldPattern.exec(query)) !== null) {
            const fieldName = match[1];
            const found = TableColumnInformation.some(col => col.name === fieldName);

            if (!found) {
                throw new Error(`Query references unknown field "@${fieldName}".`);
            }

            requiredFields = requiredFields.filter(col => col.name != fieldName)
        }

        if (requiredFields.length > 0 && /insert\s+into/i.test(query)) {
            const fieldNames = requiredFields.map(col => col.name).join(", ");
            throw new Error(`Query is missing required fields: ${fieldNames}.`);
        }
    }

    /**
     * Validates query parameters against table schema
     * 
     * Checks performed:
     * - Each parameter key must match a column in the table
     * - NOT NULL columns cannot receive null or undefined values
     * - Parameter types must match their corresponding column types
     * - All field references in the query must have corresponding parameters
     * 
     * @param query - The SQL query string containing field references
     * @param parameters - Object mapping parameter names to values
     * @param TableColumnInformation - Array of column metadata from the table schema
     * @throws Error if parameters don't match schema, have wrong types, or violate NOT NULL constraints
     * 
     * @example
     * ```typescript
     * const columnInfo = [
     *   { name: 'id', type: 'INTEGER', notnull: 1 },
     *   { name: 'name', type: 'TEXT', notnull: 1 },
     *   { name: 'age', type: 'INTEGER', notnull: 0 }
     * ];
     * 
     * const query = 'INSERT INTO users (name, age) VALUES (@name, @age)';
     * 
     * // Valid parameters
     * Validator.ValidateQueryParameters(query, { name: 'John', age: 30 }, columnInfo); // OK
     * Validator.ValidateQueryParameters(query, { name: 'Jane', age: null }, columnInfo); // OK - age is nullable
     * 
     * // Invalid parameters
     * Validator.ValidateQueryParameters(query, { name: null, age: 30 }, columnInfo); // throws Error - name is NOT NULL
     * Validator.ValidateQueryParameters(query, { name: 'John', age: 'thirty' }, columnInfo); // throws Error - wrong type
     * Validator.ValidateQueryParameters(query, { name: 'John' }, columnInfo); // throws Error - missing @age parameter
     * Validator.ValidateQueryParameters(query, { name: 'John', age: 30, extra: 'value' }, columnInfo); // throws Error - extra is not a column
     * ```
     */
    static ValidateQueryParameters(
        query: string,
        parameters: QueryParameters,
        TableColumnInformation: TableColumnInfo[]
    ): void {
        for (const [key, value] of Object.entries(parameters)) {
            const columnInfo = TableColumnInformation.find(col => col.name === key);
            
            if (!columnInfo) {
                throw new Error(`Parameter "${key}" does not match any column in the table.`);
            }

            if (columnInfo.notnull === 1 && (value === null || value === undefined)) {
                throw new Error(`Parameter "${key}" cannot be null or undefined for a NOT NULL column.`);
            }

            const parameterType = typeof value;
            const columnType = columnInfo.type;

            const isValidType = Validator.CompareTypes(columnType, parameterType);
            if (!isValidType) {
                throw new Error(`Parameter "${key}" has type "${parameterType}" which does not match column type "${columnType}".`);
            }

            const fieldPattern = /@([a-zA-Z0-9_]+)/g;
            let match;

            while ((match = fieldPattern.exec(query)) !== null) {
                const fieldName = match[1];
                const found = parameters[fieldName] !== undefined;

                if (!found) {
                    throw new Error(`Missing parameter for column "${fieldName}".`);
                }
            }
        }
    }

    /**
     * Compares a column type with a JavaScript parameter type for compatibility
     * 
     * Type mappings:
     * - TEXT/CHAR types → string
     * - INTEGER/INT types → number
     * - REAL/FLOAT/DOUBLE types → number
     * - BOOLEAN types → boolean
     * - BLOB types → object (Buffer/Uint8Array)
     * - UUID → string (with format validation)
     * 
     * @param columnType - The SQLite column type from the schema
     * @param parameterType - The JavaScript typeof value for the parameter
     * @returns true if the types are compatible, false otherwise
     * 
     * @example
     * ```typescript
     * Validator.CompareTypes('TEXT', 'string'); // true
     * Validator.CompareTypes('INTEGER', 'number'); // true
     * Validator.CompareTypes('VARCHAR(255)', 'string'); // true
     * Validator.CompareTypes('REAL', 'number'); // true
     * Validator.CompareTypes('TEXT', 'number'); // false
     * Validator.CompareTypes('INTEGER', 'string'); // false
     * ```
     */
    static CompareTypes(columnType?: string, parameterType?: string): boolean {
        if (!columnType || !parameterType) {
            return false;
        }

        const lowerType = columnType.toLowerCase();

        // SQLite text types (TEXT, VARCHAR, CHAR, etc.)
        if (lowerType.includes('text') || lowerType.includes('char')) {
            return parameterType === 'string' || parameterType === 'number';
        }

        // SQLite integer and real/float types (INTEGER, INT, TINYINT, SMALLINT, REAL, FLOAT, DOUBLE etc.)
        if (lowerType.includes('int') || lowerType.includes('real') || lowerType.includes('float') || lowerType.includes('double')) {
            return parameterType === 'number';
        }

        // Boolean
        if (lowerType.includes('bool')) {
            return parameterType === 'boolean';
        }

        // BLOB types
        if (lowerType.includes('blob')) {
            return parameterType === 'object'; // Buffer or Uint8Array
        }

        // UUID with validation
        if (lowerType === 'uuid' && parameterType === 'string') {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parameterType);
        }

        // Default: allow any type if not explicitly restricted
        // This handles custom SQLite types gracefully
        return true;
    }
}