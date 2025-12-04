import { RunResult, Statement } from "better-sqlite3";
import IStatementAdapter from "@core/interfaces/IStatementAdapter";

export default class BetterSqlite3Statement implements IStatementAdapter {
    private stmt: Statement;

    constructor(stmt: Statement) {
        this.stmt = stmt;
    }
    
    run(parameters?: object): RunResult {
        return parameters ? this.stmt.run(parameters) : this.stmt.run();
    }

    all(parameters?: object): unknown[] {
        return parameters ? this.stmt.all(parameters) : this.stmt.all();
    }

    get(parameters?: object): unknown | undefined {
        return parameters ? this.stmt.get(parameters) : this.stmt.get();
    }
}