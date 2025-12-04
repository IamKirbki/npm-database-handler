import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";
import IStatementAdapter from "@core/interfaces/IStatementAdapter";
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

    async transaction(fn: (items: unknown[]) => void): Promise<Function> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }

        return this.db.transaction(fn);
    }

    async close(): Promise<void> {
        if (!this.db) {
            throw new Error("Database is not connected.");
        }
        
        this.db.close();
        this.db = null;
    }
    
} 