export class SqlUtils {
    // Common SQL clause terminators
    static readonly CLAUSE_TERMINATORS = [
        'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'HAVING', 
        'UNION', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
        'FULL JOIN', 'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 
        'FULL OUTER JOIN'
    ];

    // Common operators
    static readonly OPERATORS = ['=', '!=', '<>', '<', '<=', '>', '>=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'];

    // Common aggregate functions
    static readonly AGGREGATE_FUNCTIONS = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER', 
        'LENGTH', 'SUBSTR', 'TRIM', 'ROUND', 'ABS', 'DISTINCT'
    ];

    static createTerminatorPattern(): string {
        return `(${this.CLAUSE_TERMINATORS.map(term => 
            term.includes(' ') ? `\\s+${term.replace(' ', '\\s+')}` : `\\s+${term}`
        ).join('|')}|;|$)`;
    }

    static createOperatorPattern(): string {
        return this.OPERATORS
            .sort((a, b) => b.length - a.length) // Longer operators first
            .map(op => {
                // Add word boundaries for operators that are words
                if (/^[A-Z\s]+$/.test(op)) {
                    return `\\b${op.replace(/\s+/g, '\\s+')}\\b`;
                }
                // Escape special regex characters for symbol operators
                return op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            })
            .join('|');
    }

    static parseTableWithAlias(tableString: string): { tableName: string; alias?: string } {
        const parts = tableString.trim().split(/\s+as\s+|\s+/i).filter(part => part.length > 0);
        return {
            tableName: parts[0],
            alias: parts[1] || undefined
        };
    }

    static splitByLogicalOperators(content: string): string[] {
        return content
            .split(/(\s+and\s+|\s+or\s+)/i)
            .filter(part => !/^\s*(and|or)\s*$/i.test(part))
            .map(part => part.trim());
    }
}