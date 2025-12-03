export type SelectValues = {
    column: string[] | string;
    expression?: SelectExpression;
    alias?: string;
};

export type SelectExpression = {
    name: string,
    columns: string[]
    alias?: string
};

export type CaseExpression = {
    columns: string[];
    operator?: string;
    alias?: string;
}

export type ShouldBeTypes = "NUMBER" | "STRING" | "DATE" | SqlBoolean;

export type SqlBoolean = 0 | 1;

export type SelectExpressionsRule = {
    name: string,
    parameterRange: [number, number]
}

export type FromValues = {
    tableName: string;
    alias?: string
};

export type WhereValues = {
    value: string;
    condition: OperatorTypes;
    searchValue: string;
};

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

export type SubQueryValues = {
    queries: string[];
    tablesUsed: FromValues[];
}