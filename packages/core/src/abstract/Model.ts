import Repository from "@core/runtime/Repository.js";
import { columnType, QueryCondition, QueryValues, ModelConfig } from "@core/types/index.js";

/** Abstract Model class for ORM-style database interactions */
export default abstract class Model<ModelType extends columnType> {
    private _repository: Repository<ModelType, Model<ModelType>> = Repository.getInstance<ModelType>(
        this.constructor as new () => Model<ModelType>
    );

    protected defaultConfiguration: ModelConfig = {
        table: this.constructor.name.toLowerCase(),
        primaryKey: 'id',
        incrementing: true,
        keyType: 'number',
        timestamps: true,
        createdAtColumn: 'created_at',
        updatedAtColumn: 'updated_at',
        guarded: ['*'],
    };

    protected configuration: ModelConfig = { ...this.defaultConfiguration };

    public get configurationConfig(): ModelConfig {
        return this.configuration;
    }

    protected originalAttributes: Partial<ModelType> = {};
    protected attributes: Partial<ModelType> = {};
    protected exists: boolean = false;
    protected dirty: boolean = false;
    protected queryScopes?: QueryCondition;

    public get primaryKey(): QueryValues | undefined {
        return this.attributes[this.configuration.primaryKey]; 
    }

    public get values(): Partial<ModelType> | ModelType {
        return this.attributes;
    }

    public static where<ParamterModelType extends Model<columnType>>(
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
        attributes: Partial<columnType>
    ): ParamterModelType {
        const instance = new this();
        return instance.set(attributes);
    }

    public set(attributes: Partial<ModelType>): this {
        if(attributes[this.configuration.primaryKey] !== undefined && !this.exists) {
            this._repository.syncModel(this)
        }
        this.attributes = { ...this.attributes, ...attributes };
        this.dirty = true;
        return this;
    }

    public save(): this {
        this._repository.save(this.attributes, this.originalAttributes);
        this.originalAttributes = { ...this.originalAttributes, ...this.attributes };
        this.exists = true;
        this.dirty = false;
        return this;
    }
}