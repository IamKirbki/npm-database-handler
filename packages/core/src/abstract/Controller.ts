import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";
import Model from "./Model";

export abstract class Controller<M extends Model<object>> {
    constructor(
        protected adapter: IDatabaseAdapter, 
        protected Model: new (adapter: IDatabaseAdapter, data?: object) => M 
    ){}

    abstract index(): Promise<M[]>;
    abstract show(id: string): Promise<M | undefined>;
    abstract create(data: object): Promise<M>;
    abstract update(id: string, data: object): Promise<void>;
    abstract delete(id: string): Promise<void>;
}