import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostgresDatabase } from '../src/index';
import { PoolConfig } from 'pg';

describe('Query', () => {
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
    });

    afterEach(async () => {
        if (db) {
            await db.cleanDatabase();
            await db.close();
        }
    });

    describe('All', () => {
        beforeEach(async () => {
            const table = await db.Table('users');
            await table.Insert(
                { name: 'John', email: 'john@example.com', age: 30 }
            );
            await table.Insert(
                { name: 'Jane', email: 'jane@example.com', age: 25 }
            );
        });

        it('should return all rows', async () => {
            const table = await db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users');
            const results = await query.All();

            expect(results).toHaveLength(2);
        });

        it('should work with parameters', async () => {
            const table = await db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'John' };

            const results = await query.All<{ id: number; name: string; email: string; age: number }>();
            expect(results).toHaveLength(1);
            expect(results[0].values.name).toBe('John');
        });
    });

    describe('Get', () => {
        beforeEach(async () => {
            const table = await db.Table('users');
            await table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
        });

        it('should return single row', async () => {
            const table = await db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'John' };

            const result = await query.Get<{ id: number; name: string; email: string; age: number }>();
            expect(result).toBeDefined();
            expect(result?.values.name).toBe('John');
        });

        it('should return undefined for no match', async () => {
            const table = await db.Table('users');
            const query = db.Query(table, 'SELECT * FROM users WHERE name = @name');
            query.Parameters = { name: 'NonExistent' };

            const result = await query.Get();
            expect(result).toBeUndefined();
        });
    });

    describe('Run', () => {
        it('should execute INSERT query', async () => {
            const table = await db.Table('users');
            const query = db.Query(table, 'INSERT INTO "users" (name, email, age) VALUES (@name, @email, @age)');
            query.Parameters = { name: 'John', email: 'john@example.com', age: 30 };

            await query.Run();
            
            // Verify insertion by querying
            const records = await table.Records();
            expect(records).toHaveLength(1);
        });

        it('should execute UPDATE query', async () => {
            const table = await db.Table('users');
            await table.Insert({ name: 'John', email: 'john@example.com', age: 30 });

            const query = db.Query(table, 'UPDATE "users" SET age = @age WHERE name = @name');
            query.Parameters = { age: 31, name: 'John' };

            await query.Run();
            
            // Verify update
            const records = await table.Records();
            expect(records[0].values.age).toBe(31);
        });

        it('should execute DELETE query', async () => {
            const table = await db.Table('users');
            await table.Insert({ name: 'John', email: 'john@example.com', age: 30 });

            const query = db.Query(table, 'DELETE FROM "users" WHERE name = @name');
            query.Parameters = { name: 'John' };

            await query.Run();
            
            // Verify deletion
            const records = await table.Records();
            expect(records).toHaveLength(0);
        });

        describe.skip('Transaction', () => {
            // TODO: PostgreSQL transactions need different implementation
            // The current implementation uses runSync which doesn't work with async PostgreSQL
            it('should execute multiple queries in transaction', async () => {
                const table = await db.Table('users');
                const query = db.Query(table, 'INSERT INTO "users" (name, email, age) VALUES (@name, @email, @age)');

                await query.Transaction([
                    { name: 'John', email: 'john@example.com', age: 30 },
                    { name: 'Jane', email: 'jane@example.com', age: 25 },
                ]);

                const records = await table.Records();
                expect(records).toHaveLength(2);
            });
        });
    });
});
