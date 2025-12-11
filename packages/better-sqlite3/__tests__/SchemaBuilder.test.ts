import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Database } from '../src/index';
import { BetterSqlite3SchemaBuilder } from '../src/BetterSqlite3SchemaBuilder';
import BetterSqlite3Adapter from '../src/BetterSqlite3Adapter';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('BetterSqlite3SchemaBuilder', () => {
  const testDbPath = path.join(__dirname, '..', 'test-schema.db');
  let db: BetterSqlite3Database;
  let adapter: BetterSqlite3Adapter;
  let schemaBuilder: BetterSqlite3SchemaBuilder;

  beforeEach(() => {
    db = new BetterSqlite3Database(testDbPath);
    adapter = db['adapter'] as BetterSqlite3Adapter;
    schemaBuilder = new BetterSqlite3SchemaBuilder(adapter);
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('createTable', () => {
    it('should create a simple table', async () => {
      await schemaBuilder.createTable('users', (table) => {
        table.string('name');
        table.string('email');
      });

      const tableInfo = await adapter.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      const result = await tableInfo.get() as any;
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'users');
    });

    it('should create a table with primary key', async () => {
      await schemaBuilder.createTable('users', (table) => {
        table.integer('id').primaryKey();
        table.string('name');
      });

      const pragmaStmt = await adapter.prepare("PRAGMA table_info(users)");
      const columns = await pragmaStmt.all() as any[];
      
      expect(columns).toHaveLength(2);
      const idColumn = columns.find((col: any) => col.name === 'id');
      expect(idColumn).toBeDefined();
      expect(idColumn.pk).toBe(1);
    });

    it('should create a table with auto-incrementing id', async () => {
      await schemaBuilder.createTable('posts', (table) => {
        table.integer('id').increments();
        table.string('title');
      });

      const tableInfo = await adapter.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'");
      const result = await tableInfo.get() as any;
      
      expect(result).toBeDefined();
      expect(result.sql).toContain('CREATE TABLE posts (id INTEGER AUTO_INCREMENT, title VARCHAR)');
    });

    it('should create a table with various column types', async () => {
      await schemaBuilder.createTable('products', (table) => {
        table.integer('id').primaryKey();
        table.string('name', 100);
        table.integer('quantity');
        table.boolean('in_stock');
      });

      const pragmaStmt = await adapter.prepare("PRAGMA table_info(products)");
      const columns = await pragmaStmt.all() as any[];
      
      expect(columns).toHaveLength(4);
      expect(columns.find((col: any) => col.name === 'name')).toBeDefined();
      expect(columns.find((col: any) => col.name === 'quantity')).toBeDefined();
      expect(columns.find((col: any) => col.name === 'in_stock')).toBeDefined();
    });

    it('should create a table with timestamps', async () => {
      await schemaBuilder.createTable('articles', (table) => {
        table.integer('id').primaryKey();
        table.string('title');
        table.timestamps();
      });

      const pragmaStmt = await adapter.prepare("PRAGMA table_info(articles)");
      const columns = await pragmaStmt.all() as any[];
      
      expect(columns).toHaveLength(4);
      expect(columns.find((col: any) => col.name === 'created_at')).toBeDefined();
      expect(columns.find((col: any) => col.name === 'updated_at')).toBeDefined();
    });
  });

  describe('dropTable', () => {
    it('should drop an existing table', async () => {
      await schemaBuilder.createTable('temp_table', (table) => {
        table.string('data');
      });

      let tableCheck = await adapter.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='temp_table'");
      let result = await tableCheck.get();
      expect(result).toBeDefined();

      await schemaBuilder.dropTable('temp_table');

      tableCheck = await adapter.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='temp_table'");
      result = await tableCheck.get();
      expect(result).toBeUndefined();
    });

    it('should not throw error when dropping non-existent table', async () => {
      await expect(schemaBuilder.dropTable('non_existent_table')).resolves.not.toThrow();
    });
  });

  describe.skip('alterTable', () => {
    it('should alter a table by adding columns', async () => {
      await schemaBuilder.createTable('users', (table) => {
        table.integer('id').primaryKey();
        table.string('name');
      });

      await schemaBuilder.alterTable('users', (table) => {
        table.string('email');
      });

      const pragmaStmt = await adapter.prepare("PRAGMA table_info(users)");
      const columns = await pragmaStmt.all();
      
      expect(columns.find((col: any) => col.name === 'email')).toBeDefined();
    });
  })

  describe('Integration tests', () => {
    it('should handle table with increments', async () => {
      await schemaBuilder.createTable('posts', (table) => {
        table.increments('id');
        table.string('title');
        table.string('content');
      });

      const pragmaStmt = await adapter.prepare("PRAGMA table_info(posts)");
      const columns = await pragmaStmt.all() as any[];
      
      expect(columns).toHaveLength(3);
      expect(columns.find((col: any) => col.name === 'id')).toBeDefined();
    });

    it('should create table with multiple string lengths', async () => {
      await schemaBuilder.createTable('test_table', (table) => {
        table.string('short_text', 50);
        table.string('long_text', 500);
        table.string('default_text');
      });

      const tableInfo = await adapter.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='test_table'");
      const result = await tableInfo.get() as any;
      
      expect(result).toBeDefined();
      expect(result.sql).toContain('VARCHAR(50)');
      expect(result.sql).toContain('VARCHAR(500)');
    });
  });
});
