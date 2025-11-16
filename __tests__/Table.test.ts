import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from '../src/Database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Table', () => {
    const testDbPath = path.join(__dirname, '..', 'test-table.db');
    let db: Database;

    beforeEach(() => {
        db = new Database(testDbPath);
        db.CreateTable('users', {
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

    describe('Properties', () => {
        it('should return table name', () => {
            const table = db.Table('users');
            expect(table.Name).toBe('users');
        });

        it('should return column information', () => {
            const table = db.Table('users');
            const columns = table.TableColumnInformation;

            expect(columns.length).toBe(4); // id, name, email, age
            expect(columns.find(c => c.name === 'name')).toBeDefined();
            expect(columns.find(c => c.name === 'email')).toBeDefined();
            expect(columns.find(c => c.name === 'age')).toBeDefined();
        });

        it('should return readable column information', () => {
            const table = db.Table('users');
            const columns = table.ReadableTableColumnInformation;

            const nameCol = columns.find(c => c.name === 'name');
            expect(nameCol?.nullable).toBe(false);
            expect(nameCol?.type).toBe('TEXT');
        });
    });

    describe('Insert', () => {
        it('should insert a single record', () => {
            const table = db.Table('users');
            const result = table.Insert({ name: 'John', email: 'john@example.com', age: 30 });

            expect(result.lastInsertRowid).toBeDefined();
            expect(result.changes).toBe(1);
        });

        it('should insert multiple records', () => {
            const table = db.Table('users');
            table.Insert([
                { name: 'John', email: 'john@example.com', age: 30 },
                { name: 'Jane', email: 'jane@example.com', age: 25 },
            ]);

            const records = table.Records();
            expect(records.length).toBe(2);
        });

        it('should throw error for empty array', () => {
            const table = db.Table('users');
            expect(() => {
                table.Insert([]);
            }).toThrow('Cannot insert empty array');
        });
    });

    describe('Records', () => {
        beforeEach(() => {
            const table = db.Table('users');
            table.Insert([
                { name: 'John', email: 'john@example.com', age: 30 },
                { name: 'Jane', email: 'jane@example.com', age: 25 },
                { name: 'Bob', email: 'bob@example.com', age: 35 },
            ]);
        });

        it('should return all records', () => {
            const table = db.Table('users');
            const records = table.Records();

            expect(records.length).toBe(3);
            expect(records[0].values).toHaveProperty('name');
        });

        it('should filter records with where clause', () => {
            const table = db.Table('users');
            const records = table.Records({ where: { name: 'John' } });

            expect(records.length).toBe(1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((records[0].values as any).name).toBe('John');
        });

        it('should limit records', () => {
            const table = db.Table('users');
            const records = table.Records({ limit: 2 });

            expect(records.length).toBe(2);
        });

        it('should order records', () => {
            const table = db.Table('users');
            const records = table.Records({ orderBy: 'age DESC' });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((records[0].values as any).age).toBe(35);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((records[2].values as any).age).toBe(25);
        });

        it('should select specific columns', () => {
            const table = db.Table('users');
            const records = table.Records({ select: 'name, age' });

            expect(records[0].values).toHaveProperty('name');
            expect(records[0].values).toHaveProperty('age');
            expect(records[0].values).not.toHaveProperty('email');
        });
    });

    describe('Record', () => {
        beforeEach(() => {
            const table = db.Table('users');
            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
        });

        it('should return a single record', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            expect(record).toBeDefined();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((record?.values as any).name).toBe('John');
        });

        it('should return undefined for non-existent record', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'NonExistent' } });

            expect(record).toBeUndefined();
        });
    });

    describe('RecordsCount', () => {
        it('should return count of records', () => {
            const table = db.Table('users');
            table.Insert([
                { name: 'John', email: 'john@example.com', age: 30 },
                { name: 'Jane', email: 'jane@example.com', age: 25 },
            ]);

            expect(table.RecordsCount).toBe(2);
        });

        it('should return 0 for empty table', () => {
            const table = db.Table('users');
            expect(table.RecordsCount).toBe(0);
        });
    });
});
