import { columnType } from "@core/types/index";
import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";

export default interface IController<M> {
    adapter: IDatabaseAdapter;
    Model: new (adapter: IDatabaseAdapter, data?: columnType) => M

    index(): Promise<M[]>;
    show(id: string): Promise<M | undefined>;
    create(data: object): Promise<M>;
    update(id: string, data: object): Promise<void>;
    delete(id: string): Promise<void>;
}