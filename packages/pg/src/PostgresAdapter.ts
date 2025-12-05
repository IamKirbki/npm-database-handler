import { IDatabaseAdapter, IStatementAdapter, TableColumnInfo } from "@iamkirbki/database-handler-core";
import { Pool, PoolConfig } from "pg";
import PostgresStatement from "./PostgresStatement";

export default class PostgresAdapter implements IDatabaseAdapter {
    private pool: Pool | null = null;

    async connect(config: PoolConfig): Promise<void> {
        this.pool = new Pool(config);
    }

    async prepare(query: string): Promise<IStatementAdapter> {
        const client = this.pool ? await this.pool.connect() : undefined;
        return new PostgresStatement(query, client);
    }

    async exec(query: string): Promise<void> {
        const client = this.pool ? await this.pool.connect() : undefined;
        const statement = new PostgresStatement(query, client);
        await statement.run();
    }
    
    // eslint-disable-next-line no-unused-vars
    async transaction(fn: (items: unknown[]) => void): Promise<Function> {
        const client = this.pool ? await this.pool.connect() : undefined;
        if (!client) {
            throw new Error("Database client is not available for transaction.");
        }

        await client.query('BEGIN');

        const rollback = async () => {
            await client.query('ROLLBACK');
            client.release();
        };

        const commit = async () => {
            await client.query('COMMIT');
            client.release();
        };

        try {
            fn([]);
            await commit();
        } catch (error) {
            await rollback();
            throw error;
        }

        return commit;
    }

    async tableColumnInformation(tableName: string): Promise<TableColumnInfo[]> {
        const client = this.pool ? await this.pool.connect() : undefined;
        if (!client) {
            throw new Error("Database client is not available.");
        }

        const query = `
            SELECT *
            FROM information_schema.columns
            WHERE table_name = $1
        `;

        const res = await client.query(query, [tableName]);
        client.release();

        return res.rows.map((row: { column_name: string; data_type: string; is_nullable: string; column_default: string | null }, index: number) => ({
            cid: index,
            name: row.column_name,
            type: row.data_type,
            notnull: row.is_nullable === 'NO' ? 1 : 0,
            dflt_value: row.column_default,
            pk: 0 // PostgreSQL does not provide primary key info in this query
        }));
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }

} 