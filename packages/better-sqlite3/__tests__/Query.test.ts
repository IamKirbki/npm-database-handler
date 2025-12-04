import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Database } from '../src/index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Query', () => {
    const testDbPath = path.join(__dirname, '..', 'test-query.db');
    let db: BetterSqlite3Database;

    beforeEach(() => {
        db = new BetterSqlite3Database(testDbPath);
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
            table.Insert(
                { name: 'John', email: 'john@example.com', age: 30 }
            );
            table.Insert(
                { name: 'Jane', email: 'jane@example.com', age: 25 }
            );
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
    });
});
