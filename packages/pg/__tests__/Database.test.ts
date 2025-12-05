import { describe, it, expect, afterEach } from 'vitest';
import { PostgresDatabase } from '../src';
import { PoolConfig } from 'pg';

describe('Database', () => {
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

  afterEach(async () => {
    // Clean up test database
    if (db) {
      await db.cleanDatabase();
      await db.close();
    }
  });

  describe('Constructor', () => {
    it('should create a database instance', async () => {
      db = await PostgresDatabase.create(testDbConfig);
      expect(db).toBeInstanceOf(PostgresDatabase);
    });
  });

  describe('CreateTable', () => {
    it('should create a new table with id column', async () => {
      db = await PostgresDatabase.create(testDbConfig);
      const table = await db.CreateTable('users', {
        id: "SERIAL PRIMARY KEY"
      });

      expect(table).toBeDefined();
      expect(table.Name).toBe('users');

      const columns = await table.TableColumnInformation();
      
      expect(columns.length).toBeGreaterThan(0);
      const idColumn = columns.find(col => col.name === 'id' || col.column_name === 'id');
      expect(idColumn).toBeDefined();
    });

    it('should not fail when creating table that already exists', async () => {
      db = await PostgresDatabase.create(testDbConfig);
      const table1 = await db.CreateTable('users', {
        id: "SERIAL PRIMARY KEY"
      });
      const table2 = await db.CreateTable('users', {
        id: "SERIAL PRIMARY KEY"
      });

      expect(table1.Name).toBe(table2.Name);
    });
  });

  describe('Table', () => {
    it('should get an existing table', async () => {
      db = await PostgresDatabase.create(testDbConfig);
      await db.CreateTable('users', {
        id: "SERIAL PRIMARY KEY"
      });

      const table = await db.Table('users');
      expect(table.Name).toBe('users');
    });
  });

  describe('Query', () => {
    it('should create a query object', async () => {
      db = await PostgresDatabase.create(testDbConfig);
      const table = await db.CreateTable('users', {
        id: "SERIAL PRIMARY KEY"
      });

      const query = db.Query(table, 'SELECT * FROM users');
      expect(query).toBeDefined();
    });
  });
});
