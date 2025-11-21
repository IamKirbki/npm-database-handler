export type SelectValues = {
    columns: string[];
    expressions: string[];
}

export type FromValues = {
    tables: { tableName: string; alias?: string }[];
}