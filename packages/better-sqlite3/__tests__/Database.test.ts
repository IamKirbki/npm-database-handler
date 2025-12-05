import { describe, it, expect, afterEach } from 'vitest';
import { BetterSqlite3Database } from '../src/index';
import path from 'path';    
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Database', () => {
  const testDbPath = path.join(__dirname, '..', 'test.db');
  let db: BetterSqlite3Database;

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Constructor', () => {
    it('should create a database instance', () => {
      db = new BetterSqlite3Database(testDbPath);
      expect(db).toBeInstanceOf(BetterSqlite3Database);
    });

    it('should create an in-memory database', () => {
      db = new BetterSqlite3Database(':memory:');
      expect(db).toBeInstanceOf(BetterSqlite3Database);
    });
  });

  describe('CreateTable', () => {
    it('should create a new table with id column', async () => {
      db = new BetterSqlite3Database(testDbPath);
      const table = await db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      expect(table).toBeDefined();
      expect(table.Name).toBe('users');

      const columns = await table.TableColumnInformation();
      expect(columns.length).toBeGreaterThan(0);
      expect(columns[0].name).toBe('id');
      expect(columns[0].pk).toBe(1);
    });

    it('should not fail when creating table that already exists', async () => {
      db = new BetterSqlite3Database(testDbPath);
      const table1 = await db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });
      const table2 = await db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      expect(table1.Name).toBe(table2.Name);
    });
  });

  describe('Table', () => {
    it('should get an existing table', async () => {
      db = new BetterSqlite3Database(testDbPath);
      await db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      const table = await db.Table('users');
      expect(table.Name).toBe('users');
    });
  });

  describe('Query', () => {
    it('should create a query object', async () => {
      db = new BetterSqlite3Database(testDbPath);
      const table = await db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      const query = db.Query(table, 'SELECT * FROM users');
      expect(query).toBeDefined();
      expect(query.Table).toBe(table);
    });
  });
});
