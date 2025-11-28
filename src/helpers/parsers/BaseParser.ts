export abstract class BaseParser<T> {
    protected readonly query: string;
    protected _values?: T;
    
    public get Values(): T | undefined {
        return this._values;
    }

    constructor(query: string) {
        this.query = this.normalizeQuery(query);
        this._values = this.parse();
    }

    protected normalizeQuery(query: string): string {
        return query.split('\n').map(line => line.trim()).join(' ').replace(/\s+/g, ' ').trim();
    }

    protected abstract parse(): T;

    protected extractClause(
        pattern: RegExp, 
        errorMessage?: string
    ): { content: string; fullMatch: string } | null {
        const match = this.query.match(pattern);
        if (!match || match.length < 2) {
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            return null;
        }
        return {
            content: match[1].trim(),
            fullMatch: match[0]
        };
    }
}