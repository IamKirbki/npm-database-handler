import Repository from "@core/runtime/Repository";
import { columnType, QueryCondition } from "@core/types/index.js";
import { ModelConfig } from "@core/types/model";

/** Abstract Model class for ORM-style database interactions */
export default abstract class Model<ModelType extends columnType> {
    private repository: Repository<ModelType, Model<ModelType>> = Repository.getInstance<ModelType>(
        this.constructor as new () => Model<ModelType>
    );

    protected configuration: ModelConfig = {
        table: this.constructor.name.toLowerCase(),
        primaryKey: 'id',
        incrementing: true,
        keyType: 'number',
        timestamps: true,
        createdAtColumn: 'created_at',
        updatedAtColumn: 'updated_at',
        guarded: ['*'],
    };

    public get configurationConfig(): ModelConfig {
        return this.configuration;
    }

    protected originalAttributes: Partial<ModelType> = {};
    protected attributes: Partial<ModelType> = {};
    protected exists: boolean = false;
    protected dirty: boolean = false;
    protected queryScopes?: QueryCondition;

    public get primaryKey(): string | number | undefined {
        return this.attributes[this.configuration.primaryKey];
    }

    public static where<ParamterModelType extends Model<any>>(
        this: new () => ParamterModelType, 
        conditions: QueryCondition
    ): ParamterModelType {
        const instance = new this();
        return instance.where(conditions);
    }
    
    public where(conditions: QueryCondition): this {
        this.queryScopes = conditions;
        return this;
    }

    public static set<ParamterModelType extends Model<columnType>>(
        this: new () => ParamterModelType, 
        key: keyof columnType, 
        value: columnType[keyof columnType]
    ): ParamterModelType {
        const instance = new this();
        return instance.set(key, value);;
    }

    public set(key: keyof ModelType, value: ModelType[keyof ModelType]): this {
        if(key === this.configuration.primaryKey && !this.exists) {
            this.repository.updateModel(this)
        }
        this.attributes[key] = value;
        this.dirty = true;
        return this;
    }

    public save(): this {
        this.repository.save(this.attributes, this.originalAttributes);
        this.originalAttributes = { ...this.originalAttributes, ...this.attributes };
        this.exists = true;
        this.dirty = false;
        return this;
    }
}