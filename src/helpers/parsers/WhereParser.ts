import { WhereValues } from "../../../types/index";

export default class WhereParser {
    private readonly query: string;

    private _whereValues?: WhereValues;
    public get WhereValues(): WhereValues | undefined {
        return this._whereValues;
    }

    constructor(query: string) {
        this.query = query.split('\n').map(line => line.trim()).join(' ');
        this._whereValues = this.ParseConditions();
    }

    private ParseConditions(): WhereValues {
        const whereClause = this.query.match(/where\s+(.*?)(\s+group\s+by|\s+order\s+by|\s+limit|;|$)/i);
        if (!whereClause || whereClause.length < 2) {
            throw new Error("Invalid SQL query: WHERE clause not found.");
        }

        const whereContent = whereClause[1].trim();
        const conditions = whereContent.split(/(\s+and\s+|\s+or\s+)/i).filter(cond => !/^\s*(and|or)\s*$/i.test(cond)).map(cond => {
            const match = cond.match(/(.*?)\s*(!=|<>|<=|>=|=|<|>| like | in | is\s+null| is\s+not\s+null)\s*(.*)/i);

            if (match) {
                return {
                    value: match[1].trim(),
                    condition: match[2].trim(),
                    searchValue: match[3].trim()
                };
            } else {
                throw new Error(`Invalid condition in WHERE clause: ${cond}`);
            }
        });

        return conditions;
    }
}