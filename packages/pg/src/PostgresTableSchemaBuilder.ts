import { SchemaTableBuilder } from "@core/abstract/Schema";

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

    increments(name?: string) {
        return this.addColumn({
            name,
            autoincrement: true,
        })
    }

    primaryKey(name?: string): this {
        return this.addColumn({
            name,
            constraints: ['PRIMARY KEY'],
        });
    }

    string(name?: string, length?: number): this {
        return this.addColumn({
            name,
            datatype: length ? `VARCHAR(${length})` : 'VARCHAR',
        });
    }

    integer(name?: string): this {
        return this.addColumn({
            name,
            datatype: 'INTEGER',
        });
    }

    boolean(name?: string): this {
        return this.addColumn({
            name,
            datatype: 'BOOLEAN',
        });
    }

    timestamps(): this {
        this.addColumn({
            name: 'created_at',
            datatype: 'TIMESTAMP',
            constraints: ['NOT NULL', 'DEFAULT CURRENT_TIMESTAMP']
        });

        this.addColumn({
            name: 'updated_at',
            datatype: 'TIMESTAMP',
            constraints: ['NOT NULL', 'DEFAULT CURRENT_TIMESTAMP']
        });

        return this;
    }

}