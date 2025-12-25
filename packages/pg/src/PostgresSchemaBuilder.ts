import { PostgresTableSchemaBuilder } from "./PostgresTableSchemaBuilder.js";
import PostgresAdapter from "./PostgresAdapter.js";
import { AbstractSchemaBuilder } from "@iamkirbki/database-handler-core";

export class PostgresSchemaBuilder implements AbstractSchemaBuilder {
    // eslint-disable-next-line no-unused-vars
    constructor(private _adapter: PostgresAdapter){}

    // eslint-disable-next-line no-unused-vars
    async createTable(name: string, callback: (table: PostgresTableSchemaBuilder) => void) {
        const tableBuilder = new PostgresTableSchemaBuilder();
        callback(tableBuilder);

        const cols = tableBuilder.build();
        const query = `CREATE TABLE IF NOT EXISTS ${name} ${cols}`;
        
        const statement = await this._adapter.prepare(query);
        statement.run();
    }

    async dropTable(name: string) {
        const query = `DROP TABLE IF EXISTS ${name}`;
        const statement = await this._adapter.prepare(query);
        statement.run();
    }

    // eslint-disable-next-line no-unused-vars
    async alterTable(_oldName: string, _callback: (table: PostgresTableSchemaBuilder) => void): Promise<void> {
        throw new Error("Method not implemented.");
    }

    // // eslint-disable-next-line no-unused-vars
    // async alterTable(oldName: string, callback: (table: PostgresTableSchemaBuilder) => void) {
    //     const tableBuilder = new PostgresTableSchemaBuilder();
    //     callback(tableBuilder);
        
    //     const cols = tableBuilder.build();
    //     const query = `ALTER TABLE ${oldName} ${cols}`;
    //     const statement = await this._adapter.prepare(query);
    //     statement.run();
    // }
}