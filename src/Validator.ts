import { QueryParameters } from "../types/query";
import { TableColumnInfo } from "../types/table";

export default class Validator {
    static ValidateTableName(name: string): void {
        if (!name || typeof name !== "string") {
            throw new Error("Table name must be a non-empty string.");
        }
        if (name.includes(",")) {
            throw new Error("Table name cannot contain commas.");
        }
        if (/[^a-zA-Z0-9_]/.test(name)) {
            throw new Error("Table name must only contain letters, numbers, and underscores.");
        }
    }

    static ValidateColumnName(name: string): void {
        if (!name || typeof name !== "string") {
            throw new Error("Column name must be a non-empty string.");
        }
        if (name.includes(",")) {
            throw new Error("Column name cannot contain commas.");
        }
        if (/[^a-zA-Z0-9_]/.test(name)) {
            throw new Error("Column name must only contain letters, numbers, and underscores.");
        }
    }

    static ValidateColumnType(type: string): void {
        const validTypes = [
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

        const sqlKeywords = [
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
        ]

        if (!type || typeof type !== "string") {
            throw new Error("Column type must be a non-empty string.");
        }

        const cleanedType = type
            .toUpperCase()
            .replace(/\([0-9 , a-zA-Z]*\)/g, "") // Remove (255), (10,2), etc.
            .replace(new RegExp(`\\b(${sqlKeywords.join("|")})\\b`, "gi"), "")
            .trim();

        if (!validTypes.includes(cleanedType)) {
            throw new Error(`Invalid column type "${type}". Valid types are: ${validTypes.join(", ")}.`);
        }
    }

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

            // Check for null/undefined in NOT NULL columns
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

    static CompareTypes(columnType?: string, parameterType?: string): boolean {
        if (!columnType || !parameterType) {
            return false;
        }

        const lowerType = columnType.toLowerCase();

        // SQLite text types (TEXT, VARCHAR, CHAR, etc.)
        if (lowerType.includes('text') || lowerType.includes('char')) {
            return parameterType === 'string';
        }

        // SQLite integer types (INTEGER, INT, TINYINT, SMALLINT, etc.)
        if (lowerType.includes('int')) {
            return parameterType === 'number';
        }

        // SQLite real/float types (REAL, FLOAT, DOUBLE, etc.)
        if (lowerType.includes('real') || lowerType.includes('float') || lowerType.includes('double')) {
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