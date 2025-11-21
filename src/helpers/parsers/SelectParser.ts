import { SelectValues } from "types/index";

export default class SelectParser {
    private readonly AGGREGATE_FUNCTIONS = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'TRIM',
        'ROUND', 'ABS', 'DISTINCT', "CASE", "WHEN", "THEN", "ELSE", "END"
    ];

    private readonly query: string;


    public get SelectValues(): SelectValues | undefined {
        return this._selectValues;
    }

    private _selectValues?: SelectValues;

    constructor(query: string) {
        this.query = query.split('\n').map(line => line.trim()).join(' ');
        this._selectValues = {
            columns: this.ParseColumns(),
            expressions: this.ParseExpressions()
        };
    }

    public ParseColumns(): string[] {
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

    public ParseExpressions(): string[] {
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