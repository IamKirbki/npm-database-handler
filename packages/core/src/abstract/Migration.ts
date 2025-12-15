import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";

export default abstract class Migration {
    abstract up(db: IDatabaseAdapter): Promise<void>;
    abstract down(db: IDatabaseAdapter): Promise<void>;
}