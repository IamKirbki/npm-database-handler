import { QueryParameters } from "index";
// table.ts
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

export type Join = {
    fromTable: Table;
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    on: QueryParameters | QueryParameters[];
}

// export type Join = RequireAtLeastOne<SingleJoin, 'table' | 'join'>;