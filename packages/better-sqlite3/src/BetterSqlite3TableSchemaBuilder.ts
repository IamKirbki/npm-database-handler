import { SchemaTableBuilder } from "@core/abstract/Schema";

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

    foreign(name?: string, referenceTable?: string, referenceColumn?: string): this {
        if(name && referenceTable && referenceColumn) {
            const constraint = `FOREIGN KEY(${name}) REFERENCES ${referenceTable}(${referenceColumn})`;
            return this.addColumn({
                name,
                constraints: [constraint],
            });
        }

        return this;
    }
    
    uuid(name?: string): this {
        return this.addColumn({
            name,
            datatype: 'UUID',
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
            datatype: 'DATETIME',
            constraints: ['NOT NULL', 'DEFAULT CURRENT_TIMESTAMP'],
        });

        this.addColumn({
            name: 'updated_at',
            datatype: 'DATETIME',
            constraints: ['NOT NULL', 'DEFAULT CURRENT_TIMESTAMP'],
        });

        return this;
    }
}