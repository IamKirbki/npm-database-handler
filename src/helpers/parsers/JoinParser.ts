import { JoinTypes, JoinValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

export default class JoinParser extends BaseParser<JoinValues[]> {
    public get JoinValues(): JoinValues[] | undefined {
        return this.Values;
    }

    protected parse(): JoinValues[] {
        const joinTypes = [
            "SELF JOIN", "NATURAL JOIN", "INNER JOIN", "LEFT OUTER JOIN", 
            "RIGHT OUTER JOIN", "FULL OUTER JOIN", "LEFT JOIN", "RIGHT JOIN", 
            "FULL JOIN", "CROSS JOIN", "JOIN"
        ];
        
        const joinTypePattern = `\\b(${joinTypes.join('|').replace(/\s/g, '\\s+')})`;
        const tableNamePattern = `\\s+([a-zA-Z_][a-zA-Z0-9_]*)`;
        const aliasPattern = `(?:\\s+(?:AS\\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?`;
        const onConditionPattern = `\\s+ON\\s+(.+?)`;
        const lookaheadPattern = `(?=${joinTypes.join('|').replace(/\s/g, '\\s+')}|${SqlUtils.createTerminatorPattern()})`;

        const joinRegex = new RegExp(
            `${joinTypePattern}${tableNamePattern}${aliasPattern}${onConditionPattern}${lookaheadPattern}`,
            "gi"
        );
        
        const joins: JoinValues[] = [];
        let match: RegExpExecArray | null;

        while ((match = joinRegex.exec(this.query)) !== null) {
            const joinType = match[1].replace(/\s+/g, ' ').toUpperCase() as JoinTypes;
            const tableName = match[2];
            const alias = match[3] || undefined;
            const onCondition = match[4].trim();

            joins.push({
                joinType,
                tableName,
                alias,
                onCondition
            });
        }

        return joins;
    }
}