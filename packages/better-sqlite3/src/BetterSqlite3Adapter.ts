import { IDatabaseAdapter, IStatementAdapter, TableColumnInfo } from "@iamkirbki/database-handler-core";
import Database from "better-sqlite3";
import BetterSqlite3Statement from "./BetterSqlite3Statement";

export default class BetterSqlite3Adapter implements IDatabaseAdapter {
    private db: Database.Database | null = null;

    async connect(databasePath: string): Promise<void> {
        if (this.db) {
            throw new Error("Database is already connected.");
        }
        this.db = new Database(databasePath);
    }

    async prepare(query: string): Promise<IStatementAdapter> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }
        const stmt = this.db.prepare(query);
        return new BetterSqlite3Statement(stmt);
    }

    async exec(query: string): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }
        
        this.db.exec(query);
    }

    // eslint-disable-next-line no-unused-vars
    async transaction(fn: (items: unknown[]) => void): Promise<Function> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }

        return this.db.transaction(fn);
    }

    async tableColumnInformation(tableName: string): Promise<TableColumnInfo[]> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }
        
        const stmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
        const rows = stmt.all() as Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: string | null; pk: number }>;

        return rows.map((row) => ({
            cid: row.cid,
            name: row.name,
            type: row.type,
            notnull: row.notnull,
            dflt_value: row.dflt_value,
            pk: row.pk
        }));
    }

    async close(): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }
        
        this.db.close();
        this.db = null;
    }
    
} 