import { RunResult } from "better-sqlite3";

export default interface IStatementAdapter {
    run(parameters?: object): RunResult;
    all(parameters?: object): unknown[];
    get(parameters?: object): unknown | undefined;
}