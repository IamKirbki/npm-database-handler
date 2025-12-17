import type Model from "@core/abstract/Model.js";
import Table from "@core/base/Table.js";
import { columnType, Join, QueryCondition, relation } from "@core/types/index";

export default class Repository<Type extends columnType, ModelType extends Model<Type>> {
    private static _instances: Map<string, Repository<columnType, Model<columnType>>> = new Map();
    private models: Map<string, ModelType> = new Map();
    private Table: Table

    constructor(tableName: string, ModelClass: ModelType) {
        const modelPk = ModelClass.primaryKey?.toString() || ModelClass.constructor.name;
        this.models.set(modelPk, ModelClass);
        this.Table = new Table(tableName);
    }

    public static getInstance<ModelType extends columnType>(
        ModelClass: new () => Model<ModelType>,
        tableName: string
    ): Repository<ModelType, Model<ModelType>> {
        const className = ModelClass.name;
        if (!this._instances.has(className)) {
            const instance = new Repository<ModelType, Model<ModelType>>(tableName, new ModelClass());
            this._instances.set(className, instance);
            return instance;
        }

        return this._instances.get(className) as Repository<ModelType, Model<ModelType>>;
    }

    public syncModel(model: ModelType): void {
        const modelPk = model.primaryKey?.toString() || model.constructor.name;
        this.models.set(modelPk, model);
    }

    public getModel(name: string): ModelType {
        return this.models.get(name) as ModelType;
    }

    public async save(attributes: Partial<Type>, oldAttributes: Partial<Type>): Promise<void> {
        const dataToSave: Partial<Type> = { ...oldAttributes, ...attributes };
        await this.Table.Insert(dataToSave as Type);
    }

    public async get(conditions: QueryCondition, Model: Model<Type>): Promise<Type | null> {
        let record;
        if (Model.JoinedEntities.length > 0) {
            record = await this.join(Model, conditions);
        } else {
            record = await this.Table.Record({ where: conditions });
        }

        return record ? record.values as Type : null;
    }

    public async update(attributes: Partial<Type>): Promise<this> {
        const primaryKey = (this.models.values().next().value as Model<Type>).Configuration.primaryKey;
        const pkValue = attributes[primaryKey];
        if (pkValue) {
            const record = await this.Table.Record({ where: { [primaryKey]: pkValue } });
            if (record) {
                await record.Update(attributes);
            }
        } else {
            throw new Error("Primary key value is required for update.");
        }

        return this;
    }

    public async all(Model: Model<Type>): Promise<Type[]> {
        if (Model.JoinedEntities.length > 0) {
            return await this.join(Model);
        } else {
            return await this.Table.Records().then(records => records.map(record => record.values as Type));
        }
    }

    private async join(Model: Model<Type>, conditions?: QueryCondition): Promise<Type[]> {
        const Join: Join[] = Model.JoinedEntities.map(join => {
            const relation: relation | undefined = Model.Relations.find(rel => rel.model.Configuration.table.toLowerCase() === join.toLowerCase());
            if (!relation) {
                throw new Error(`Relation for joined entity ${join} not found.`);
            }

            const JoinType = relation.type === 'hasOne' || relation.type === 'belongsTo' ? 'INNER' : 'LEFT';

            return {
                fromTable: new Table(relation.model.Configuration.table),
                joinType: JoinType,
                on: [
                    { [relation.foreignKey]: relation.localKey as string }
                ]
            }
        })
      
        return (await this.Table.Join(Join, { where: conditions })).map(record => record.values as Type);
    }
}