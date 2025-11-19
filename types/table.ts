import { QueryParameters } from "./index";
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

export type Join = {
    fromTable: Table;
    join?: Join;
    on: QueryParameters | QueryParameters[];
}

// export type Join = RequireAtLeastOne<SingleJoin, 'table' | 'join'>;