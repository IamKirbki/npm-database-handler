import { FromValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

export default class FromParser extends BaseParser<FromValues[]> {
    public get FromValues(): FromValues[] | undefined {
        return this.Values;
    }

    protected parse(): FromValues[] {
        const clause = this.extractClause(
            new RegExp(`from\\s+(.*?)${SqlUtils.createTerminatorPattern()}`, 'i'),
            "Invalid SQL query: FROM clause not found."
        );
        
        if (!clause) return [];

        return clause.content.split(',').map(table => 
            SqlUtils.parseTableWithAlias(table)
        );
    }
}