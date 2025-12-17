import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";

export default interface Migration {
    up(db: IDatabaseAdapter): Promise<void>;
    down(db: IDatabaseAdapter): Promise<void>;
}