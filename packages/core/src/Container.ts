import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter.js";
import Table from "@core/base/Table.js";

class Container {
    private static instance: Container;
    private adapters: Map<string, IDatabaseAdapter> = new Map();
    private defaultAdapter?: IDatabaseAdapter;

    private constructor() {}

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    public registerAdapter(name: string, adapter: IDatabaseAdapter, isDefault = false): void {
        this.adapters.set(name, adapter);
        if (isDefault || !this.defaultAdapter) {
            this.defaultAdapter = adapter;
        }
    }

    public getAdapter(name?: string): IDatabaseAdapter {
        if (name) {
            const adapter = this.adapters.get(name);
            if (!adapter) throw new Error(`Adapter '${name}' not found`);
            return adapter;
        }
        if (!this.defaultAdapter) throw new Error("No default adapter set");
        return this.defaultAdapter;
    }

    public async resolveTable(tableName: string): Promise<Table> {
        return new Table(tableName);
    }
}

export default Container;