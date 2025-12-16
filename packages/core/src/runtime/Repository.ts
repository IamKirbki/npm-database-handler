import type Model from "@core/abstract/Model";
import Table from "@core/base/Table";
import { columnType } from "@core/types";

export default class Repository<Type extends columnType, ModelType extends Model<Type>> {
    private static instances: Map<string, Repository<columnType, Model<columnType>>> = new Map();
    private models: Map<string, ModelType> = new Map();
    private Table: Table
    
    constructor(ModelClass: ModelType) {
        const modelPk = ModelClass.primaryKey?.toString() || ModelClass.constructor.name;
        this.models.set(modelPk, ModelClass);
        this.Table = new Table(ModelClass.configurationConfig.table);
    }

    public static getInstance<ModelType extends columnType>(
        ModelClass: new () => Model<ModelType>
    ): Repository<ModelType, Model<ModelType>> {
        const className = ModelClass.name;
        if (!this.instances.has(className)) {
            const instance = new Repository<ModelType, Model<ModelType>>(new ModelClass());
            this.instances.set(className, instance);
            return instance;
        } 

        return this.instances.get(className) as Repository<ModelType, Model<ModelType>>;
    }

    public updateModel(model: ModelType): void {
        const modelPk = model.primaryKey?.toString() || model.constructor.name;
        this.models.set(modelPk, model);
    }

    public getModel(name: string): ModelType {
        return this.models.get(name) as ModelType;
    }

    public async save(attributes: Partial<Type>, oldAttributes: Partial<Type>): Promise<void> {
        const dataToSave: Partial<Type> = { ...oldAttributes, ...attributes };
        await this.Table.Insert(dataToSave);
    }
} 