import { SchemaTableBuilder } from "@iamkirbki/database-handler-core";

export class PostgresTableSchemaBuilder extends SchemaTableBuilder {
    build(): string {
        const columnDefinitions = this.columns.map(column => {
            let definition = `${column.name} ${column.datatype || ''}`.trim();

            if (column.constraints && column.constraints.length > 0) {
                definition += ' ' + column.constraints.join(' ');
            }

            if (column.autoincrement) {
                definition = `${column.name} SERIAL`;
            }

            return definition;
        });

        return `(${columnDefinitions.join(', ')})`;
    }

    // Datatypes
    uuid(name: string): this {
        return this.addColumn({
            name,
            datatype: 'UUID',
        });
    }

    string(name: string, length?: number): this {
        return this.addColumn({
            name,
            datatype: length ? `VARCHAR(${length})` : 'VARCHAR',
        });
    }

    text(name: string): this {
        return this.addColumn({
            name,
            datatype: 'TEXT',
        });
    }

    integer(name: string): this {
        return this.addColumn({
            name,
            datatype: 'INTEGER',
        });
    }

    decimal(name: string, precision?: number, scale?: number): this {
        let datatype = 'DECIMAL';
        if (precision !== undefined && scale !== undefined) {
            datatype = `DECIMAL(${precision},${scale})`;
        }
        return this.addColumn({
            name,
            datatype,
        });
    }

    float(name: string): this {
        return this.addColumn({
            name,
            datatype: 'REAL',
        });
    }

    boolean(name: string): this {
        return this.addColumn({
            name,
            datatype: 'BOOLEAN',
        });
    }

    json(name: string): this {
        return this.addColumn({
            name,
            datatype: 'JSONB',
        });
    }

    timestamp(name: string): this {
        return this.addColumn({
            name,
            datatype: 'TIMESTAMP',
        });
    }

    time(name: string): this {
        return this.addColumn({
            name,
            datatype: 'TIME',
        });
    }

    timestamps(): this {
        this.addColumn({
            name: 'created_at',
            datatype: 'TIMESTAMP',
            constraints: ['DEFAULT CURRENT_TIMESTAMP']
        });

        this.addColumn({
            name: 'updated_at',
            datatype: 'TIMESTAMP',
            constraints: ['DEFAULT CURRENT_TIMESTAMP']
        });

        return this;
    }

    // Constraints
    increments() {
        if (this.columns.length === 0) {
            throw new Error('increments() requires a previous column. Call a datatype method first.');
        }
        return this.addColumn({
            autoincrement: true,
        })
    }

    primaryKey(): this {
        if (this.columns.length === 0) {
            throw new Error('primaryKey() requires a previous column. Call a datatype method first.');
        }
        return this.addColumn({
            constraints: ['PRIMARY KEY'],
        });
    }

    foreignKey(referenceTable: string, referenceColumn: string): this {
        if (this.columns.length === 0) {
            throw new Error('foreignKey() requires a previous column. Call a datatype method first.');
        }
        const constraint = `REFERENCES ${referenceTable}(${referenceColumn})`;
        return this.addColumn({
            constraints: [constraint],
        });
    }

    unique(): this {
        if (this.columns.length === 0) {
            throw new Error('unique() requires a previous column. Call a datatype method first.');
        }
        return this.addColumn({
            constraints: ['UNIQUE'],
        });
    }

    nullable(): this {
        if (this.columns.length === 0) {
            throw new Error('nullable() requires a previous column. Call a datatype method first.');
        }
        return this.addColumn({
            constraints: ['NULLABLE'],
        });
    }

    default(value: unknown): this {
        if (this.columns.length === 0) {
            throw new Error('default() requires a previous column. Call a datatype method first.');
        }
        let defaultValue: string | number | boolean;

        if (typeof value === 'string') {
            defaultValue = `'${value}'`;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            defaultValue = value;
        } else {
            defaultValue = String(value);
        }

        return this.addColumn({
            constraints: [`DEFAULT ${defaultValue}`],
        });
    }
}