import { SchemaTableBuilder } from "@iamkirbki/database-handler-core";

export class BetterSqlite3TableSchemaBuilder extends SchemaTableBuilder {
    build(): string {
        const columnDefinitions = this.columns.map(column => {
            let definition = `${column.name} ${column.datatype || ''}`.trim();

            if (column.autoincrement) {
                definition += ' AUTO_INCREMENT';
            }

            if (column.constraints && column.constraints.length > 0) {
                definition += ' ' + column.constraints.join(' ');
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
        // SQLite does not have a native JSON type, but uses TEXT
        return this.addColumn({
            name,
            datatype: 'TEXT',
        });
    }

    enum(name: string, values: string[]): this {
        // SQLite does not have a native ENUM type, but we can use a CHECK constraint
        const quotedValues = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        return this.addColumn({
            name,
            datatype: 'TEXT',
            constraints: [`CHECK (${name} IN (${quotedValues}))`],
        });
    }

    timestamp(name: string): this {
        return this.addColumn({
            name,
            datatype: 'DATETIME',
        });
    }

    time(name: string): this {
        // SQLite does not have a TIME type, but uses TEXT
        return this.addColumn({
            name,
            datatype: 'TEXT',
        });
    }
    
    timestamps(): this {
        this.addColumn({
            name: 'created_at',
            datatype: 'DATETIME',
            constraints: ['DEFAULT CURRENT_TIMESTAMP'],
        });

        this.addColumn({
            name: 'updated_at',
            datatype: 'DATETIME',
            constraints: ['DEFAULT CURRENT_TIMESTAMP'],
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
        const lastColumn = this.columns[this.columns.length - 1];
        const constraint = `FOREIGN KEY(${lastColumn.name}) REFERENCES ${referenceTable}(${referenceColumn})`;
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

    defaultTo(value: unknown): this {
        if (this.columns.length === 0) {
            throw new Error('defaultTo() requires a previous column. Call a datatype method first.');
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

    softDeletes(): this {
        this.addColumn({
            name: 'deleted_at',
            datatype: 'DATETIME',
        });

        return this.nullable();
    }

    morphs(name: string): this {
        this.integer(`${name}_id`);
        return this.string(`${name}_type`);
    }
}