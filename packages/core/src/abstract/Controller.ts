import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";
import Model from "./Model";
import { columnType } from "@core/types/index";

export default abstract class Controller<M extends Model<columnType>> {
    constructor(
        protected adapter: IDatabaseAdapter, 
        protected Model: new (adapter: IDatabaseAdapter, data?: columnType) => M 
    ){}
}