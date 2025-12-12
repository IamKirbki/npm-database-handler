import IDatabaseAdapter from "../interfaces/IDatabaseAdapter.js";
import { QueryCondition } from "../types/query.js";
import Table from "../Table.js";
import Record from "../Record.js";

export default abstract class Model<T extends object> {
    private Table: Table;
    private QueryParams: QueryCondition = {};

    public constructor(table: Table) {
        this.Table = table;
    }

    public static async connect<M extends Model<object>>(
        // eslint-disable-next-line no-unused-vars
        this: new (table: Table) => M,
        adapter: IDatabaseAdapter
    ): Promise<M> {
        const table = await Table.create(this.name, adapter);
        return new this(table);
    }

    private async RecordGet(): Promise<Record<T> | undefined> {
        return await this.Table.Record<T>({ where: this.QueryParams });
    }

    public async get(): Promise<T | undefined> {
        const record = await this.RecordGet();
        return record?.values;
    }

    public async all(): Promise<T[]> {
        const records = await this.Table.Records<T>({ where: this.QueryParams });
        return records.map(record => record.values);
    }

    public where(QueryCondition: QueryCondition): this {
        this.QueryParams = QueryCondition;
        return this;
    }

    public async create(data: T): Promise<Record<T> | undefined> {
        return await this.Table.Insert(data as unknown as QueryCondition);
    }

    public async update(data: T): Promise<void> {
        const record = await this.RecordGet();
        if (record) {
            await record.Update(data);
        }
    }

    public async delete(): Promise<void> {
        const record = await this.RecordGet();
        if (record) {
            await record.Delete();
        }
    }
}