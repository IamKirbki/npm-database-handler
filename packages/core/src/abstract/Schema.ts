export abstract class AbstractSchemaBuilder {
    abstract createTable(
        name: string,
        columns: { [key: string]: string },
    ): Promise<void>;

    abstract dropTable(
        name: string
    ): Promise<void>;

    abstract alterTable(
        oldName: string,
        
    ): Promise<void>;
}

export abstract class SchemaTableBuilder {
    abstract increments(name: string): this;
    abstract string(name: string, length?: number): this;
    abstract integer(name: string): this;
    abstract boolean(name: string): this;
    abstract timestamps(): this;
}