import { GroupByValues, OperatorTypes } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

export default class GroupByParser extends BaseParser<GroupByValues[]> {
    private _groupByValues?: GroupByValues[];
    
    public get GroupByValues(): GroupByValues[] | undefined {
        return this._groupByValues;
    }

    constructor(query: string) {
        super(query);
        this._groupByValues = this.parse();
    }

    protected parse(): GroupByValues[] {
        const clause = this.extractClause(
            /group\s+by\s+(.*?)(?:\s+(?:having|order\s+by|limit)|;|$)/i
        );
        
        if (!clause) {
            return [];
        }

        const columns = clause.content
            .split(',')
            .map((col: string) => col.trim())
            .filter((col: string) => col.length > 0);
        
        const havingConditions = this.parseHavingClause();

        return [{
            columns,
            havingConditions
        }];
    }

    private parseHavingClause() {
        const havingClause = this.extractClause(
            /having\s+(.*?)(?:\s+(?:order\s+by|limit)|;|$)/i
        );
        
        if (!havingClause) {
            return undefined;
        }

        const operatorPattern = `(\\w+(?:\\.\\w+)?|\\w+\\([^)]*\\))\\s*(${SqlUtils.createOperatorPattern()})\\s*(.+)`;
        const havingMatch = havingClause.content.match(new RegExp(operatorPattern, 'i'));
        
        if (havingMatch && havingMatch.length >= 4) {
            return {
                value: havingMatch[1].trim(),
                condition: havingMatch[2].trim() as OperatorTypes,
                searchValue: havingMatch[3].trim()
            };
        }

        return undefined;
    }
}