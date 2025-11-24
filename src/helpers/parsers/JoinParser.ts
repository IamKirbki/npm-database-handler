import { JoinTypes, JoinValues } from "types/index";

export default class JoinParser {
    private readonly query: string;

    private _joinValues?: JoinValues[];
    public get JoinValues(): JoinValues[] | undefined {
        return this._joinValues;
    }

    constructor(query: string) {
        this.query = query.replace(/\s+/g, " ").trim();
        this._joinValues = this.ParseJoins();
    }

    private ParseJoins(): JoinValues[] {
        const joinTypes =
            "SELF JOIN|NATURAL JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|CROSS JOIN|LEFT OUTER JOIN|RIGHT OUTER JOIN|FULL OUTER JOIN|JOIN";
        const joinTypePattern = `\\b(${joinTypes})`;
        const tableNamePattern = `\\s+([a-zA-Z_][a-zA-Z0-9_]*)`;
        const aliasPattern = `(?:\\s+(?:AS\\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?`;
        const onConditionPattern = `\\s+ON\\s+(.+?)`;
        const lookaheadPattern = `(?=${joinTypes}|$)`;

        const joinRegex = new RegExp(
            `${joinTypePattern}${tableNamePattern}${aliasPattern}${onConditionPattern}${lookaheadPattern}`,
            "gi"
        );
        const joins: JoinValues[] = [];
        let match: RegExpExecArray | null;

        while ((match = joinRegex.exec(this.query)) !== null) {
            const joinType = match[1].toUpperCase() as JoinTypes;
            const tableName = match[2];
            const alias = match[3];
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