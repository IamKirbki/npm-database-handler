export default class FromParser {
    private readonly query: string;

    constructor(query: string) {
        this.query = query.split('\n').map(line => line.trim()).join(' ');
    }

    public ParseTables(): { tableName: string; alias?: string }[] {
        const fromClause = this.query.match(/from\s+(.*?)(\s+where|\s+group\s+by|\s+order\s+by|\s+left|\s+inner|\s+outer|\s+right|\s+limit|\s+union|\s+join|\s+full|\s+cross|;|$)/i);
        if (!fromClause || fromClause.length < 2) {
            throw new Error("Invalid SQL query: FROM clause not found.");
        }

        const fromContent = fromClause[1].trim();
        const tables = fromContent.split(',').map(table => {
            const parts = table.trim().split(/\s+as\s+|\s+/i).filter(part => part.length > 0);

            if (parts[1]) {
                return {
                    tableName: parts[0],
                    alias: parts[1]
                };
            } else {
                return {
                    tableName: parts[0]
                };
            }
        });

        return tables;
    }
}