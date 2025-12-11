import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostgresAdapter, PostgresDatabase, PostgresSchemaBuilder } from '../src/index';
import { PoolConfig } from 'pg';

describe('PostgresSchemaBuilder', () => {
  let adapter: PostgresAdapter;
  let schemaBuilder: PostgresSchemaBuilder;

  const testDbConfig: PoolConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'test_db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  let db: PostgresDatabase;

  beforeEach(async () => {
    db = await PostgresDatabase.create(testDbConfig);
    adapter = db['postgresAdapter'] as PostgresAdapter;
    schemaBuilder = new PostgresSchemaBuilder(adapter);
  });

  afterEach(async () => {
    if (db) {
      await db.cleanDatabase();
      await db.close();
    }
  });

  describe('createTable', () => {
    it('should create a simple table', async () => {
      await schemaBuilder.createTable('users', (table) => {
        table.string('name');
        table.string('email');
      });

      const tableInfo = await adapter.prepare("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'");
      const result = await tableInfo.get() as any;

      expect(result).toBeDefined();
      expect(result).toHaveProperty('tablename', 'users');
    });

    it('should create a table with primary key', async () => {
      await schemaBuilder.createTable('users', (table) => {
        table.integer('id').primaryKey();
        table.string('name');
      });

      const stmt = await adapter.prepare(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
      `);
      const columns = await stmt.all() as any[];

      expect(columns).toHaveLength(2);
      const idColumn = columns.find((col: any) => col.column_name === 'id');
      expect(idColumn).toBeDefined();
      expect(idColumn.data_type).toBe('integer');
    });

    it('should create a table with auto-incrementing id', async () => {
      await schemaBuilder.createTable('posts', (table) => {
        table.increments('id');
        table.string('title');
      });

      const stmt = await adapter.prepare(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'posts'
      `);
      const columns = await stmt.all() as any[];

      expect(columns).toHaveLength(2);
      const idColumn = columns.find((col: any) => col.column_name === 'id');
      expect(idColumn).toBeDefined();
      expect(idColumn.data_type).toBe('integer');
    });

    it('should create a table with various column types', async () => {
      await schemaBuilder.createTable('products', (table) => {
        table.integer('id').primaryKey();
        table.string('name', 100);
        table.integer('quantity');
        table.boolean('in_stock');
      });

      const stmt = await adapter.prepare(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products'
      `);
      const columns = await stmt.all() as any[];

      expect(columns).toHaveLength(4);
      expect(columns.find((col: any) => col.column_name === 'name')).toBeDefined();
      expect(columns.find((col: any) => col.column_name === 'quantity')).toBeDefined();
      expect(columns.find((col: any) => col.column_name === 'in_stock')).toBeDefined();
    });

    it('should create a table with timestamps', async () => {
      await schemaBuilder.createTable('articles', (table) => {
        table.integer('id').primaryKey();
        table.string('title');
        table.timestamps();
      });

      const stmt = await adapter.prepare(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'articles'
      `);
      const columns = await stmt.all() as any[];

      expect(columns).toHaveLength(4);
      expect(columns.find((col: any) => col.column_name === 'created_at')).toBeDefined();
      expect(columns.find((col: any) => col.column_name === 'updated_at')).toBeDefined();
    });
  });

  describe('dropTable', () => {
    it('should drop an existing table', async () => {
      await schemaBuilder.createTable('temp_table', (table) => {
        table.string('data');
      });

      let tableCheck = await adapter.prepare("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temp_table'");
      let result = await tableCheck.get();
      expect(result).toBeDefined();

      await schemaBuilder.dropTable('temp_table');

      tableCheck = await adapter.prepare("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temp_table'");
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

      const stmt = await adapter.prepare(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
      `);
      const columns = await stmt.all();

      expect(columns.find((col: any) => col.column_name === 'email')).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    it('should handle table with increments', async () => {
      await schemaBuilder.createTable('posts', (table) => {
        table.increments('id');
        table.string('title');
        table.string('content');
      });

      const stmt = await adapter.prepare(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'posts'
      `);
      const columns = await stmt.all() as any[];

      expect(columns).toHaveLength(3);
      expect(columns.find((col: any) => col.column_name === 'id')).toBeDefined();
    });

    it('should create table with multiple string lengths', async () => {
      await schemaBuilder.createTable('test_table', (table) => {
        table.string('short_text', 50);
        table.string('long_text', 500);
        table.string('default_text');
      });

      const stmt = await adapter.prepare(`
        SELECT column_name, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'test_table'
      `);
      const columns = await stmt.all() as any[];

      expect(columns).toBeDefined();
      const shortText = columns.find((col: any) => col.column_name === 'short_text');
      const longText = columns.find((col: any) => col.column_name === 'long_text');
      
      expect(shortText).toBeDefined();
      expect(shortText.character_maximum_length).toBe(50);
      expect(longText).toBeDefined();
      expect(longText.character_maximum_length).toBe(500);
    });
  });
});
