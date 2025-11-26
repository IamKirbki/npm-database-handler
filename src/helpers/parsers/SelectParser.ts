import { SelectValue } from "types/index";

export default class SelectParser {
    private readonly AGGREGATE_FUNCTIONS = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'TRIM',
        'ROUND', 'ABS', 'DISTINCT', "CASE", "WHEN", "THEN", "ELSE", "END"
    ];

    private readonly query: string;

    private _selectValues?: SelectValue[];
    public get SelectValues(): SelectValue[] | undefined {
        return this._selectValues;
    }

    constructor(query: string) {
        this.query = query.split('\n').map(line => line.trim()).join(' ');
        const columns = this.ParseColumns();
        const expressions = this.ParseExpressions();

        columns.forEach((col, index) => {
            this._selectValues?.push({ columns: col, expressions: expressions[index] || '' });
        });
    }

    private ParseColumns(): string[] {
        const selectClause = this.query.match(/select\s+(.*?)\s+from/i);
        if (!selectClause || selectClause.length < 2) {
            throw new Error("Invalid SQL query: SELECT clause not found.");
        }

        let selectContent = selectClause[1].trim();
        
        selectContent = selectContent.replace(/^distinct\s+/i, '');
        
        const columns = selectContent.split(',').map(col => col.replace(/\s+as\s+\w+/i, '').trim());
        const regex = /[+\-*/()]/;

        return columns.map(col => {
            if (/\bcase\b/i.test(col)) {
                const whenMatches = col.match(/when\s+(\w+(?:\.\w+)?)\s*[><=!]/gi);
                if (whenMatches) {
                    return whenMatches.map(when => {
                        const match = when.match(/when\s+(\w+(?:\.\w+)?)/i);
                        return match ? match[1] : '';
                    }).filter(Boolean);
                }
                return [];
            }
            
            if (regex.test(col) && col.trim() !== "*") {
                const columnNames = col
                    .replace(/\s+as\s+\w+/i, '');

                return columnNames
                    .split(columnNames.includes("(*)") ? /[+\-/()]/ : /[+\-*/()]/)
                    .map(part => part.trim())
                    .filter(part =>
                        part &&
                        !/^\d+(\.\d+)?$/.test(part) &&
                        !this.AGGREGATE_FUNCTIONS.includes(part.toUpperCase())
                    );
            }

            return [col];
        }).flat();
    }

    private ParseExpressions(): string[] {
        const selectClause = this.query.match(/select\s+(.*?)\s+from/i);
        if (!selectClause || selectClause.length < 2) {
            throw new Error("Invalid SQL query: SELECT clause not found.");
        }

        let selectContent = selectClause[1].trim();
        
        selectContent = selectContent.replace(/^distinct\s+/i, '');

        const columns = selectContent.split(',').map(col => col.trim());
        const regex = /[+\-*/()]/;
        
        return columns.filter(col => {
            if (/\bcase\b/i.test(col)) {
                return true;
            }
            return regex.test(col);
        });
    }
}