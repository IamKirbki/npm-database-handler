import IStatementAdapter from './IStatementAdapter';

export default interface IDatabaseAdapter {
    connect(dbPath: string): void;
    prepare(query: string): IStatementAdapter;
    exec(query: string): void;
    transaction(fn: (items: any[]) => void): Function;
    close(): void;
}