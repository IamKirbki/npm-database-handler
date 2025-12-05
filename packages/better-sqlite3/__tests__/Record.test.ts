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

    beforeEach(async () => {
        db = new BetterSqlite3Database(testDbPath);
        await db.CreateTable('users', {
            id: "INTEGER PRIMARY KEY AUTOINCREMENT",
            name: 'TEXT NOT NULL',
            email: 'TEXT',
            age: 'INTEGER'
        });

        const table = await db.Table('users');
        await table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
    });

    afterEach(() => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('Properties', () => {
        it('should have values property', async () => {
            const table = await db.Table('users');
            const record = await table.Record({ where: { name: 'John' } });

            expect(record).toBeDefined();
            expect(record?.values).toBeDefined();
            expect(record?.values).toHaveProperty('name');
            expect(record?.values).toHaveProperty('email');
        });
    });

    describe('Update', () => {
        it('should update record in database', async () => {
            const table = await db.Table('users');
            const record = await table.Record({ where: { name: 'John' } });

            await record?.Update({ name: 'John Doe', age: 31 });

            const updated = await table.Record({ where: { name: 'John Doe' } });
            expect((updated?.values as UserRecord).name).toBe('John Doe');
            expect((updated?.values as UserRecord).age).toBe(31);
        });

        it('should update local values', async () => {
            const table = await db.Table('users');
            const record = await table.Record({ where: { name: 'John' } });

            await record?.Update({ age: 31 });

            expect((record?.values as UserRecord).age).toBe(31);
        });
    });

    describe('Delete', () => {
        it('should delete record from database', async () => {
            const table = await db.Table('users');
            const record = await table.Record({ where: { name: 'John' } });

            await record?.Delete();

            const deleted = await table.Record({ where: { name: 'John' } });
            expect(deleted).toBeUndefined();
        });

        it('should reduce record count', async () => {
            const table = await db.Table('users');
            const initialCount = await table.RecordsCount();

            const record = await table.Record({ where: { name: 'John' } });
            await record?.Delete();

            expect(await table.RecordsCount()).toBe(initialCount - 1);
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', async () => {
            const table = await db.Table('users');
            const record = await table.Record({ where: { name: 'John' } });

            const json = JSON.stringify(record);
            const parsed = JSON.parse(json);

            expect(parsed).toHaveProperty('name');
            expect(parsed).toHaveProperty('email');
            expect(parsed.name).toBe('John');
        });

        it('should have toString method', async () => {
            const table = await db.Table('users');
            const record = await table.Record({ where: { name: 'John' } });

            const str = record?.toString();
            expect(str).toBeDefined();
            expect(str).toContain('John');
        });
    });
});
