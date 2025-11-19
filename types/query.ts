export type QueryParameters = {
    [key: string]: QueryValues;
};

export type QueryValues = string | number | boolean | null

export type DefaultQueryOptions = {
    select?: string;
    where?: QueryParameters;
}

export type QueryOptions = {
    orderBy?: string;
    limit?: number;
    offset?: number;
};