export default interface DatabaseAdapter {
    run(query: string, parameters?: object): { changes: number; lastInsertRowid: number };
    all<T>(query: string, parameters?: object): T[];
    get<T>(query: string, parameters?: object): T | undefined;
    exec(query: string): void;
}