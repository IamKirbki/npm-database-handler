import Database from "@core/Database";
import BetterSqlite3Adapter from "./BetterSqlite3Adapter";

export class BetterSqlite3Database extends Database {
  constructor(dbPath: string) {
    const adapter = new BetterSqlite3Adapter();
    adapter.connect(dbPath);
    super(adapter);
  }
}