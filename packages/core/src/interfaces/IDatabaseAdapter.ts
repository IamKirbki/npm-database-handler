import IStatementAdapter from './IStatementAdapter';

export default interface IDatabaseAdapter {
    connect(params: unknown): Promise<void>;
    prepare(query: string): Promise<IStatementAdapter>;
    exec(query: string): Promise<void>;
    transaction(fn: (items: any[]) => void): Promise<Function>;
    close(): Promise<void>;
}