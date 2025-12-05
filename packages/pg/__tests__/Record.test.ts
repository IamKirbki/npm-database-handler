import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostgresDatabase } from '../src/index';
import { PoolConfig } from 'pg';

interface UserRecord {
    id: number;
    name: string;
    email: string;
    age: number;
}

describe('Record', () => {
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
        await db.CreateTable('users', {
            id: 'SERIAL PRIMARY KEY',
            name: 'VARCHAR(255) NOT NULL',
            email: 'VARCHAR(255)',
            age: 'INTEGER'
        });

        const table = await db.Table('users');
        await table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
    });

    afterEach(async () => {
        if (db) {
            await db.cleanDatabase();
            await db.close();
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
    
            record?.Update({ name: 'John Doe', age: 31 });
    
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
    
            record?.Delete();
    
            const deleted = await table.Record({ where: { name: 'John' } });
            expect(deleted).toBeUndefined();
        });
    
        it('should reduce record count', async () => {
            const table = await db.Table('users');
            const initialCount = await table.RecordsCount();
    
            const record = await table.Record({ where: { name: 'John' } });
            record?.Delete();
    
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
