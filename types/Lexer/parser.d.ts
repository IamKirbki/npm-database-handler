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

export type JoinTypes =
    'INNER JOIN' |
    'LEFT JOIN' |
    'RIGHT JOIN' |
    'FULL JOIN' |
    'CROSS JOIN' |
    'LEFT OUTER JOIN' |
    'RIGHT OUTER JOIN' |
    'FULL OUTER JOIN' |
    'JOIN';

export type JoinValues = {
    joinType: JoinTypes;
    tableName: string;
    alias?: string;
    onCondition: string;
}