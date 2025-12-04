import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSqlite3Database } from '../src/index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface UserRecord {
    id: number;
    name: string;
    email: string;
    age: number;
}

describe('Record', () => {
    const testDbPath = path.join(__dirname, '..', 'test-record.db');
    let db: BetterSqlite3Database;

    beforeEach(() => {
        db = new BetterSqlite3Database(testDbPath);
        db.CreateTable('users', {
            id: "INTEGER PRIMARY KEY AUTOINCREMENT",
            name: 'TEXT NOT NULL',
            email: 'TEXT',
            age: 'INTEGER'
        });

        const table = db.Table('users');
        table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
    });

    afterEach(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('Properties', () => {
        it('should have values property', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            expect(record).toBeDefined();
            expect(record?.values).toBeDefined();
            expect(record?.values).toHaveProperty('name');
            expect(record?.values).toHaveProperty('email');
        });
    });

    describe('Update', () => {
        it('should update record in database', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            record?.Update({ name: 'John Doe', age: 31 });

            const updated = table.Record({ where: { name: 'John Doe' } });
            expect((updated?.values as UserRecord).name).toBe('John Doe');
            expect((updated?.values as UserRecord).age).toBe(31);
        });

        it('should update local values', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            record?.Update({ age: 31 });

            expect((record?.values as UserRecord).age).toBe(31);
        });
    });

    describe('Delete', () => {
        it('should delete record from database', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            record?.Delete();

            const deleted = table.Record({ where: { name: 'John' } });
            expect(deleted).toBeUndefined();
        });

        it('should reduce record count', () => {
            const table = db.Table('users');
            const initialCount = table.RecordsCount;

            const record = table.Record({ where: { name: 'John' } });
            record?.Delete();

            expect(table.RecordsCount).toBe(initialCount - 1);
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            const json = JSON.stringify(record);
            const parsed = JSON.parse(json);

            expect(parsed).toHaveProperty('name');
            expect(parsed).toHaveProperty('email');
            expect(parsed.name).toBe('John');
        });

        it('should have toString method', () => {
            const table = db.Table('users');
            const record = table.Record({ where: { name: 'John' } });

            const str = record?.toString();
            expect(str).toBeDefined();
            expect(str).toContain('John');
        });
    });
});
