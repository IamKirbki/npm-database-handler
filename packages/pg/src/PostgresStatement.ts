import IStatementAdapter from "@core/interfaces/IStatementAdapter";
import { PoolClient } from "pg";

export default class PostgresStatement implements IStatementAdapter {
    private query: string;
    private client: PoolClient | undefined;

    constructor(query: string, _client: PoolClient | undefined) {
        this.query = query;
        this.client = _client;
    }

    /**
     * Transform SQLite-style named parameters (@name) to PostgreSQL positional parameters ($1, $2)
     * and convert the parameters object to an array
     */
    private transformQuery(parameters?: object): { query: string; values: unknown[] } {
        if (!parameters) {
            return { query: this.query, values: [] };
        }

        const paramMap = new Map<string, number>();
        let paramIndex = 1;
        const values: unknown[] = [];

        const transformedQuery = this.query.replace(/@(\w+)/g, (_match, paramName) => {
            if (!paramMap.has(paramName)) {
                paramMap.set(paramName, paramIndex++);
                values.push((parameters as Record<string, unknown>)[paramName]);
            }
            return `$${paramMap.get(paramName)}`;
        });

        return { query: transformedQuery, values };
    }

    async run(parameters?: object): Promise<unknown> {
        const { query, values } = this.transformQuery(parameters);
        return this.client?.query(query, values);
    }

    async all(parameters?: object): Promise<unknown[]> {
        const { query, values } = this.transformQuery(parameters);
        const res = this.client?.query(query, values).then(result => result.rows);
        return res || [];
    }

    async get(parameters?: object): Promise<unknown | undefined> {
        const { query, values } = this.transformQuery(parameters);
        return await this.client?.query(query, values).then(result => result.rows[0]);
    }
}