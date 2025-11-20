export default class Lexer {
    private queryParts?: {
        selector?: string[];
        table?: string;
        where?: string[];
        values?: string[];
        set?: string[];
        orderBy?: string;
        limit?: number;
        on?: string[];
    }

    constructor(public query: string) {
        const parts = query.trim().split(";");
        if (parts.length > 1 && parts[1].trim() !== "") {
            throw new Error("Only single statements are allowed. Multiple statements detected.");
        }
    }

    public get QueryParts() {
        {
            this.ValidateParameters([
                ...(this.GetWhere || []),
                ...(this.GetSet || [])
            ]);
            this.ValidateOnParameters(this.GetOn || []);
            this.ValidateValueParameters(this.GetValues || []);

            if (!this.queryParts) {
                this.queryParts = {
                    selector: this.GetSelector,
                    table: this.GetTable,
                    where: this.GetWhere,
                    values: this.GetValues,
                    set: this.GetSet,
                    orderBy: this.GetOrderBy,
                    limit: this.GetLimit,
                    on: this.GetOn
                };
            }

            return this.queryParts;
        }
    }

    private ValidateValueParameters(params: string[]) {
        params.forEach(param => {
            const value = param.trim();

            if (!value || !value.startsWith("@")) {
                throw new Error(`Invalid value format: ${param}. Expected format: @value`);
            }
        });
    }

    private ValidateOnParameters(params: string[]) {
        params.forEach(param => {
            const [key, value] = param.split("=").map(s => s.trim());

            if (!key || !value) {
                throw new Error(`Invalid parameter format: ${param}. Expected format: key = value`);
            } else if (!value.includes(key.split(".")[1])) {
                throw new Error(`Parameter value must reference the key: ${param}. Expected format: table.key = table.key`);
            }
        });
    }

    private ValidateParameters(params: string[]) {
        params.forEach(param => {
            const [key, value] = param.split("=").map(s => s.trim());

            if (!key || !value || !value.startsWith("@")) {
                throw new Error(`Invalid parameter format: ${param}. Expected format: key = @value`);
            } else if (!value.includes(key) && !value.includes(key.split(".")[1])) {
                throw new Error(`Parameter value must reference the key: ${param}. Expected format: key = @key`);
            }
        });
    }

    private get GetSelector(): string[] | undefined {
        let selectMatch = this.query.match(/select\s+(.+?)\s+from/i);
        if (selectMatch)
            return selectMatch[1].split(",").map(s => s.trim());

        selectMatch = this.query.match(/select\s+(.+?)(\s+where|\s+order\s+by|\s+limit|;|$)/i);
        if (selectMatch)
            return selectMatch[1].split(",").map(s => s.trim());

        return undefined;
    }

    private get GetTable(): string | undefined {
        let fromMatch = this.query.match(/from\s+([^\s;]+)/i);

        if (!fromMatch)
            fromMatch = this.query.match(/update\s+([^\s;]+)/i);

        if (!fromMatch)
            fromMatch = this.query.match(/insert\s+into\s+([^\s;]+)/i);


        if (fromMatch)
            return fromMatch[1].trim();
        else if (this.GetSelector)
            throw new Error("FROM clause is required.");

        return undefined;
    }

    private get GetWhere(): string[] | undefined {
        const whereMatch = this.query.match(/where\s+(.+?)(\s+order by|\s+limit|;|$)/i);
        if (whereMatch)
            return whereMatch[1].split("and").map(s => s.trim());

        return undefined;
    }

    private get GetValues(): string[] | undefined {
        const valuesMatch = this.query.match(/values\s*\((.+?)\)/i);
        if (valuesMatch)
            return valuesMatch[1].split(",").map(s => s.trim());

        return undefined;
    }

    private get GetSet(): string[] | undefined {
        const setMatch = this.query.match(/set\s+(.+?)(\s+where|;|$)/i);
        if (setMatch)
            return setMatch[1].split(",").map(s => s.trim());

        return undefined;
    }

    private get GetOrderBy(): string | undefined {
        const orderByMatch = this.query.match(/order by\s+([^\s;]+)/i);
        if (orderByMatch)
            return orderByMatch[1].trim();

        return undefined;
    }

    private get GetLimit(): number | undefined {
        const limitMatch = this.query.match(/limit\s+(\d+)/i);
        if (limitMatch)
            return parseInt(limitMatch[1], 10);

        return undefined;
    }

    private get GetOn(): string[] | undefined {
        const onMatch = this.query.match(/on\s+(.+?)(\s+where|;|$)/i);
        if (onMatch)
            return onMatch[1].split("and").map(s => s.trim());

        return undefined;
    }
}