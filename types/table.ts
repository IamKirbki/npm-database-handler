import Table from "../src/Table";

export type TableColumnInfo = {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: unknown;
    pk: number;
};

export type ReadableTableColumnInfo = {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: unknown;
    isPrimaryKey: boolean;
};

export type SingleJoin = {
    table: Table;
    on: string;
}