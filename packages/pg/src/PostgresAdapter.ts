import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";
import IStatementAdapter from "@core/interfaces/IStatementAdapter";
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

    async transaction(fn: (items: any[]) => void): Promise<Function> {
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
        } finally {
            client.release();
        }

        return commit;
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
    
} 