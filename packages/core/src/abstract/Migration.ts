import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";

export abstract class Migration {
    abstract name(): string;
    
    abstract up(db: IDatabaseAdapter): Promise<void>;
    abstract down(db: IDatabaseAdapter): Promise<void>;
}