import { RunResult, Statement } from "better-sqlite3";
import IStatementAdapter from "@core/interfaces/IStatementAdapter";

export default class BetterSqlite3Statement implements IStatementAdapter {
    private stmt: Statement;

    constructor(stmt: Statement) {
        this.stmt = stmt;
    }

    async run(parameters?: object): Promise<RunResult> {
        return parameters ? this.stmt.run(parameters) : this.stmt.run();
    }

    async all(parameters?: object): Promise<unknown[]> {
        return parameters ? this.stmt.all(parameters) : this.stmt.all();
    }

    async get(parameters?: object): Promise<unknown | undefined> {
        return parameters ? this.stmt.get(parameters) : this.stmt.get();
    }

    // Synchronous version for use in transactions
    runSync(parameters?: object): RunResult {
        return parameters ? this.stmt.run(parameters) : this.stmt.run();
    }
}