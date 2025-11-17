import { describe, it, expect, afterEach } from 'vitest';
import Database from '../src/Database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Database', () => {
  const testDbPath = path.join(__dirname, '..', 'test.db');

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Constructor', () => {
    it('should create a database instance', () => {
      const db = new Database(testDbPath);
      expect(db).toBeInstanceOf(Database);
      expect(db.db).toBeDefined();
    });

    it('should create an in-memory database', () => {
      const db = new Database(':memory:');
      expect(db).toBeInstanceOf(Database);
    });
  });

  describe('CreateTable', () => {
    it('should create a new table with id column', () => {
      const db = new Database(testDbPath);
      const table = db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      expect(table).toBeDefined();
      expect(table.Name).toBe('users');

      const columns = table.TableColumnInformation;
      expect(columns.length).toBeGreaterThan(0);
      expect(columns[0].name).toBe('id');
      expect(columns[0].pk).toBe(1);
    });

    it('should not fail when creating table that already exists', () => {
      const db = new Database(testDbPath);
      const table1 = db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });
      const table2 = db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      expect(table1.Name).toBe(table2.Name);
    });
  });

  describe('Table', () => {
    it('should get an existing table', () => {
      const db = new Database(testDbPath);
      db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      const table = db.Table('users');
      expect(table.Name).toBe('users');
    });

    it('should throw error for non-existent table', () => {
      const db = new Database(testDbPath);

      expect(() => {
        db.Table('nonexistent');
      }).toThrow();
    });
  });

  describe('Query', () => {
    it('should create a query object', () => {
      const db = new Database(testDbPath);
      const table = db.CreateTable('users', {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT"
      });

      const query = db.Query(table, 'SELECT * FROM users');
      expect(query).toBeDefined();
      expect(query.Table).toBe(table);
    });
  });

  describe('Table Name Validation', () => {
    it('should throw error for empty table name', () => {
      const db = new Database(testDbPath);
      expect(() => {
        db.Table('');
      }).toThrow('Table name must be a non-empty string.');
    });

    it('should throw error for table name with comma', () => {
      const db = new Database(testDbPath);
      expect(() => {
        db.Table('user,admin');
      }).toThrow('Table name cannot contain commas.');
    });

    it('should throw error for table name with special characters', () => {
      const db = new Database(testDbPath);
      expect(() => {
        db.Table('user-table');
      }).toThrow('Table name must only contain letters, numbers, and underscores.');
    });

    it('should throw error for table name with spaces', () => {
      const db = new Database(testDbPath);
      expect(() => {
        db.Table('user table');
      }).toThrow('Table name must only contain letters, numbers, and underscores.');
    });

    it('should throw error for non-string table name', () => {
      const db = new Database(testDbPath);
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.Table(123 as any);
      }).toThrow('Table name must be a non-empty string.');
    });
  });

  describe('CreateTable Validation', () => {
    it('should throw error for invalid column type', () => {
      const db = new Database(testDbPath);
      expect(() => {
        db.CreateTable('users', {
          id: "INTEGER PRIMARY KEY AUTOINCREMENT",
          name: 'INVALID_TYPE'
        });
      }).toThrow('Invalid column type');
    });
  });
});
