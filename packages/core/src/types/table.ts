import { QueryWhereParameters } from "index";
import Table from "../Table.js";

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

export type ColumnDefinition = {
    name?: string;
    datatype?: string;
    constraints?: string[];
    autoincrement?: boolean;
};

export type Join = {
    fromTable: Table;
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    on: QueryWhereParameters | QueryWhereParameters[];
}

// export type Join = RequireAtLeastOne<SingleJoin, 'table' | 'join'>;