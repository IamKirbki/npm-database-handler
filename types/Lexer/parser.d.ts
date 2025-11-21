export type SelectValues = {
    columns: string[];
    expressions: string[];
};

export type FromValues = { 
    tableName: string; 
    alias?: string 
}[];

export type WhereValues = {
    value: string;
    condition: string;
    searchValue: string;
}[];