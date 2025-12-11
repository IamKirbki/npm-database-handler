import { Database } from "@iamkirbki/database-handler-core";
import PostgresAdapter from "./PostgresAdapter.js";
import { PoolConfig } from "pg";

export class PostgresDatabase extends Database {
    private postgresAdapter: PostgresAdapter;

    private constructor(adapter: PostgresAdapter) {
        super(adapter);
        this.postgresAdapter = adapter;
    }

    static async create(config: PoolConfig): Promise<PostgresDatabase> {
        const adapter = new PostgresAdapter();
        await adapter.connect(config);
        return new PostgresDatabase(adapter);
    }

    async close(): Promise<void> {
        await this.postgresAdapter.close();
    }

    async cleanDatabase(): Promise<void> {
        // Get all tables and drop them
        const tables = await this.postgresAdapter.prepare(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        `);
        const result = await tables.all() as Array<{ tablename: string }>;
        
        for (const row of result) {
            await this.postgresAdapter.exec(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
        }
    }
}

export { PostgresSchemaBuilder } from "./PostgresSchemaBuilder.js";
export { PostgresTableSchemaBuilder } from "./PostgresTableSchemaBuilder.js";

export { PostgresAdapter };