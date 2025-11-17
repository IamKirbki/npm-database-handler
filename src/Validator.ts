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
}