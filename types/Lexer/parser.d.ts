export type SelectValue = {
    columns: string;
    expressions: string;
};

export type FromValues = {
    tableName: string;
    alias?: string
}[];

export type WhereValues = {
    value: string;
    condition: OperatorTypes;
    searchValue: string;
}[];

export type OperatorTypes =
    '=' |
    '!=' |
    '<>' |
    '<' |
    '<=' |
    '>' |
    '>=' |
    'LIKE' |
    'IN' |
    'IS NULL' |
    'IS NOT NULL';

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

export type GroupByValues = {
    columns: string[];
    havingConditions?: WhereValues;
}