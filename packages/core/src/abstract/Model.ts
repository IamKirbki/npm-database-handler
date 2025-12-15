import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";
import { QueryCondition, QueryWhereParameters } from "@core/types/query.js";
import Table from "@core/base/Table.js";
import Record from "@core/base/Record.js";
import { columnType } from "@core/types/index.js";

/** Abstract Model class for ORM-style database interactions */
export default abstract class Model<T extends columnType> {
    public Table: Table;
    private QueryParams: QueryCondition = {};
    private _currentRecord?: Record<T> | Record<T>[];

    public constructor(table: Table) {
        this.Table = table;
    }

    public static async connect<M extends Model<columnType>>(
        // eslint-disable-next-line no-unused-vars
        this: new (table: Table) => M,
        adapter: IDatabaseAdapter
    ): Promise<M> {
        const table = await Table.create(this.name, adapter);
        return new this(table);
    }

    private async RecordGet(): Promise<Record<T> | undefined> {
        if (!this._currentRecord) {
            this._currentRecord = await this.Table.Record<T>({ where: this.QueryParams });
        }

        if (Array.isArray(this._currentRecord)) {
            return this._currentRecord[0];
        }

        return this._currentRecord;
    }

    public async get(): Promise<T | undefined> {
        const record = await this.Table.Record<T>({ where: this.QueryParams });
        this._currentRecord = record;
        return record?.values;
    }

    public async all(): Promise<T[]> {
        const records = await this.Table.Records<T>({ where: this.QueryParams });
        const values = records.map(record => record.values);
        this._currentRecord = records;
        return values;
    }

    public async create(data: T): Promise<Record<T> | undefined> {
        const record = await this.Table.Insert<T>(data as QueryWhereParameters);
        this._currentRecord = record;
        return record;
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
            this._currentRecord = undefined;
        }
    }

    public where(condition: QueryCondition): this {
        this.QueryParams = condition;
        this._currentRecord = undefined;
        return this;
    }
}