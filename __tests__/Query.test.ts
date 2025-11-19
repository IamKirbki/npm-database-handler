import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from '../src/Database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Query', () => {
    const testDbPath = path.join(__dirname, '..', 'test-query.db');
    let db: Database;

    beforeEach(() => {
        db = new Database(testDbPath);
        db.CreateTable('users', {
            id: "INTEGER PRIMARY KEY AUTOINCREMENT",
            name: 'TEXT NOT NULL',
            email: 'TEXT',
            age: 'INTEGER'
        });
    });

    afterEach(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('All', () => {
        beforeEach(() => {
            const table = db.Table('users');
            table.Insert([
                { name: 'John', email: 'john@example.com', age: 30 },
                { name: 'Jane', email: 'jane@example.com', age: 25 },
            ]);
        });

        it('should return all rows', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users');
            const results = query.All();

            expect(results).toHaveLength(2);
        });

        it('should work with parameters', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'John' };

            const results = query.All<{ id: number; name: string; email: string; age: number }>();
            expect(results).toHaveLength(1);
            expect(results[0].values.name).toBe('John');
        });
    });

    describe('Get', () => {
        beforeEach(() => {
            const table = db.Table('users');
            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
        });

        it('should return single row', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'John' };

            const result = query.Get<{ id: number; name: string; email: string; age: number }>();
            expect(result).toBeDefined();
            expect(result?.values.name).toBe('John');
        });

        it('should return undefined for no match', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'NonExistent' };

            const result = query.Get();
            expect(result).toBeUndefined();
        });
    });

    describe('Run', () => {
        it('should execute INSERT query', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
            query.Parameters = { name: 'John', email: 'john@example.com', age: 30 };

            const result = query.Run<{ changes: number; lastInsertRowid: number }>();
            expect(result.changes).toBe(1);
            expect(result.lastInsertRowid).toBeDefined();
        });

        it('should execute UPDATE query', () => {
            const table = db.Table('users');
            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });

            const query = db.Query(table, 'UPDATE users SET age = @age WHERE name = @name');
            query.Parameters = { age: 31, name: 'John' };

            const result = query.Run<{ changes: number; lastInsertRowid: number }>();
            expect(result.changes).toBe(1);
        });

        it('should execute DELETE query', () => {
            const table = db.Table('users');
            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });

            const query = db.Query(table, 'DELETE FROM users WHERE name = @name');
            query.Parameters = { name: 'John' };

            const result = query.Run<{ changes: number; lastInsertRowid: number }>();
            expect(result.changes).toBe(1);
        });
    });

    describe('Transaction', () => {
        it('should execute multiple queries in transaction', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');

            query.Transaction([
                { name: 'John', email: 'john@example.com', age: 30 },
                { name: 'Jane', email: 'jane@example.com', age: 25 },
            ]);

            const records = table.Records();
            expect(records).toHaveLength(2);
        });
    });

    describe('Validation', () => {
        it('should throw error for invalid parameter', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'John', extra: 'param' };

            expect(() => {
                query.Validate();
            }).toThrow('Parameter "extra" does not match any column in the table.');
        });

        it('should throw error for missing required parameter', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
            query.Parameters = { name: 'John', email: 'john@example.com' }; // missing age

            expect(() => {
                query.Validate();
            }).toThrow('Missing parameter for column "age"');
        });

        it('should throw error for NULL value in NOT NULL column', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
            query.Parameters = { name: null, email: 'john@example.com', age: 30 };

            expect(() => {
                query.Validate();
            }).toThrow('Parameter "name" cannot be null or undefined for a NOT NULL column.');
        });

        it('should throw error for wrong parameter type', () => {
            const table = db.Table('users');
            const query = db.Query(table, 'INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
            query.Parameters = { name: 'John', email: 'john@example.com', age: 'thirty' };

            expect(() => {
                query.Validate();
            }).toThrow('Parameter "age" has type "string" which does not match column type "INTEGER".');
        });

        it('should throw error for SQL injection attempt with DROP TABLE', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, 'SELECT * FROM users; DROP TABLE users');
                query.Validate();
            }).toThrow('Query contains forbidden operations.');
        });

        it('should throw error for SQL injection attempt with DELETE', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, 'SELECT * FROM users; DELETE FROM users');
                query.Validate();
            }).toThrow('Query contains forbidden operations.');
        });

        it('should throw error for SQL injection attempt with UPDATE', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, 'SELECT * FROM users; UPDATE users SET admin = 1');
                query.Validate();
            }).toThrow('Query contains forbidden operations.');
        });

        it('should throw error for SQL injection attempt with INSERT', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, 'SELECT * FROM users; INSERT INTO users VALUES (1, "hacker")');
                query.Validate();
            }).toThrow('Query contains forbidden operations.');
        });

        it('should throw error for SQL injection attempt with ALTER TABLE', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, 'SELECT * FROM users; ALTER TABLE users ADD COLUMN admin INTEGER');
                query.Validate();
            }).toThrow('Query contains forbidden operations.');
        });

        it('should throw error for empty query string', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, '');
                query.Validate();
            }).toThrow('Query must be a non-empty string.');
        });

        it('should throw error for non-string query', () => {
            const table = db.Table('users');
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const query = db.Query(table, 123 as any);
                query.Validate();
            }).toThrow('Query must be a non-empty string.');
        });

        it('should throw error for unknown field reference', () => {
            const table = db.Table('users');
            expect(() => {
                const query = db.Query(table, 'SELECT * FROM users WHERE @nonexistent = @name');
                query.Validate();
            }).toThrow('Query references unknown field "@nonexistent".');
        });
    });
});
