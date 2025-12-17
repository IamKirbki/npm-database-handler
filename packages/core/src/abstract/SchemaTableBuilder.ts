import { ColumnDefinition } from "@core/types/index";

export default abstract class SchemaTableBuilder {
    protected columns: ColumnDefinition[] = [];

    protected addColumn(data: ColumnDefinition): this {
        if(data.name) {
            this.columns.push({
                ...data
            });
        } else {
            this.columns[this.columns.length - 1] = {
                name: this.columns[this.columns.length - 1].name,
                datatype: this.columns[this.columns.length - 1].datatype ? this.columns[this.columns.length - 1].datatype : data.datatype,
                constraints: [
                        ...((this.columns[this.columns.length - 1].constraints) || []),
                        ...(data.constraints || [])
                    ],
                autoincrement: this.columns[this.columns.length - 1].autoincrement ? this.columns[this.columns.length - 1].autoincrement : data.autoincrement || false,
            };
        }

        return this;
    }

    abstract build(): string;

    abstract increments(name: string): this;
    abstract primaryKey(name: string): this;
    abstract foreignKey(name: string, referenceTable: string, referenceColumn: string): this;
    
    abstract uuid(name: string): this;
    abstract string(name: string, length?: number): this;
    abstract integer(name: string): this;
    abstract boolean(name: string): this;
    abstract timestamps(): this;
}