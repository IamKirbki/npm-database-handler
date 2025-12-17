import { RunResult, Statement } from "better-sqlite3";
import { IStatementAdapter } from "@iamkirbki/database-handler-core";

export default class BetterSqlite3Statement implements IStatementAdapter {
    private _stmt: Statement;

    constructor(stmt: Statement) {
        this._stmt = stmt;
    }

    async run(parameters?: object): Promise<RunResult> {
        return parameters ? this._stmt.run(parameters) : this._stmt.run();
    }

    async all(parameters?: object): Promise<unknown[]> {
        return parameters ? this._stmt.all(parameters) : this._stmt.all();
    }

    async get(parameters?: object): Promise<unknown | undefined> {
        return parameters ? this._stmt.get(parameters) : this._stmt.get();
    }

    // Synchronous version for use in transactions
    runSync(parameters?: object): RunResult {
        return parameters ? this._stmt.run(parameters) : this._stmt.run();
    }
}