import { JoinTypes, JoinValues } from "types/index";

export default class JoinParser {
    private readonly query: string;

    private _joinValues?: JoinValues[];
    public get JoinValues(): JoinValues[] | undefined {
        return this._joinValues;
    }

    constructor(query: string) {
        this.query = query;
        this._joinValues = this.ParseJoins();
    }

    private ParseJoins(): JoinValues[] {
        const joinRegex = /\b(SELF\s+JOIN|NATURAL\s+JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|LEFT\s+OUTER\s+JOIN|RIGHT\s+OUTER\s+JOIN|FULL\s+OUTER\s+JOIN|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?\s+ON\s+(.+?)(?=SELF\s+JOIN|NATURAL\s+JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|LEFT\s+OUTER\s+JOIN|RIGHT\s+OUTER\s+JOIN|FULL\s+OUTER\s+JOIN|JOIN|$)/gi;
        const joins: JoinValues[] = [];
        let match: RegExpExecArray | null;

        while ((match = joinRegex.exec(this.query)) !== null) {
            const joinType = match[1].replace(/\s+/g, " ").trim().toUpperCase() as JoinTypes;
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