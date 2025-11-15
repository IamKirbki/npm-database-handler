export type TableColumnInfo = {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any | null;
    pk: number;
};

export type ReadableTableColumnInfo = {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: any | null;
    isPrimaryKey: boolean;
};