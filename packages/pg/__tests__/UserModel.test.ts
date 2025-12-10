import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PostgresDatabase } from '../src/index';
import PostgresAdapter from '../src/PostgresAdapter';
import { PoolConfig } from 'pg';
import User from '../../core/src/abstract/User';

// Run all tests sequentially to avoid connection pool issues
const describeSeq = describe.sequential;

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
let user: User;
let db: PostgresDatabase;
let adapter: PostgresAdapter;

beforeEach(async () => {
    db = await PostgresDatabase.create(testDbConfig);
    adapter = db['postgresAdapter'];
    await db.CreateTable("User", {
        id: "VARCHAR(255) PRIMARY KEY",
        name: "VARCHAR(255)"
    });
    user = await User.connect(adapter);
});

afterEach(async () => {
    if (db) {
        await db.cleanDatabase();
        await db.close();
    }
});

describeSeq("CREATE Operations", () => {
    it("should create a new user", async () => {
        const userData = { id: "1", name: "John Doe" };
        const createdRecord = await user.create(userData);

        expect(createdRecord).toBeDefined();
        expect(createdRecord?.values).toEqual(userData);
    });

    it("should create multiple users", async () => {
        const users = [
            { id: "1", name: "John Doe" },
            { id: "2", name: "Jane Smith" },
            { id: "3", name: "Bob Wilson" }
        ];

        for (const userData of users) {
            const createdRecord = await user.create(userData);
            expect(createdRecord?.values).toEqual(userData);
        }

        const allUsers = await user.all();
        expect(allUsers).toHaveLength(3);
    });
});

describeSeq("READ Operations", () => {
    beforeEach(async () => {
        // Setup test data
        await user.create({ id: "1", name: "John Doe" });
        await user.create({ id: "2", name: "Jane Smith" });
        await user.create({ id: "3", name: "Bob Wilson" });
    });

    it("should read a single user by ID", async () => {
        const foundUser = await user.where({ id: "1" }).get();
        expect(foundUser).toEqual({ id: "1", name: "John Doe" });
    });

    it("should read a single user by name", async () => {
        const foundUser = await user.where({ name: "Jane Smith" }).get();
        expect(foundUser).toEqual({ id: "2", name: "Jane Smith" });
    });

    it("should return undefined for non-existent user", async () => {
        const foundUser = await user.where({ id: "999" }).get();
        expect(foundUser).toBeUndefined();
    });

    it("should read all users", async () => {
        const allUsers = await user.all();
        expect(allUsers).toHaveLength(3);
        expect(allUsers).toContainEqual({ id: "1", name: "John Doe" });
        expect(allUsers).toContainEqual({ id: "2", name: "Jane Smith" });
        expect(allUsers).toContainEqual({ id: "3", name: "Bob Wilson" });
    });

    it("should return empty array when no users exist", async () => {
        // Clear all users first
        const allUsers = await user.all();
        for (const u of allUsers) {
            await user.where({ id: u.id }).delete();
        }

        const emptyResult = await user.all();
        expect(emptyResult).toEqual([]);
    });
});

describeSeq("UPDATE Operations", () => {
    beforeEach(async () => {
        await user.create({ id: "1", name: "John Doe" });
        await user.create({ id: "2", name: "Jane Smith" });
    });

    it("should update user name", async () => {
        await user.where({ id: "1" }).update({ id: "1", name: "John Updated" });

        const updatedUser = await user.where({ id: "1" }).get();
        expect(updatedUser).toEqual({ id: "1", name: "John Updated" });
    });

    it("should update user with new data", async () => {
        const newData = { id: "2", name: "Jane Updated Smith" };
        await user.where({ id: "2" }).update(newData);

        const updatedUser = await user.where({ id: "2" }).get();
        expect(updatedUser).toEqual(newData);
    });

    it("should maintain data integrity after update", async () => {
        await user.where({ id: "1" }).update({ id: "1", name: "Updated Name" });

        // Verify other records are unchanged
        const otherUser = await user.where({ id: "2" }).get();
        expect(otherUser).toEqual({ id: "2", name: "Jane Smith" });

        // Verify total count is maintained
        const allUsers = await user.all();
        expect(allUsers).toHaveLength(2);
    });
});

describeSeq("DELETE Operations", () => {
    beforeEach(async () => {
        await user.create({ id: "1", name: "John Doe" });
        await user.create({ id: "2", name: "Jane Smith" });
        await user.create({ id: "3", name: "Bob Wilson" });
    });

    it("should delete a user by ID", async () => {
        await user.where({ id: "1" }).delete();

        const deletedUser = await user.where({ id: "1" }).get();
        expect(deletedUser).toBeUndefined();

        // Verify other users still exist
        const remainingUsers = await user.all();
        expect(remainingUsers).toHaveLength(2);
    });

    it("should delete a user by name", async () => {
        await user.where({ name: "Jane Smith" }).delete();

        const deletedUser = await user.where({ name: "Jane Smith" }).get();
        expect(deletedUser).toBeUndefined();

        // Verify remaining users
        const remainingUsers = await user.all();
        expect(remainingUsers).toHaveLength(2);
    });

    it("should delete all users sequentially", async () => {
        // Delete all users one by one
        await user.where({ id: "1" }).delete();
        await user.where({ id: "2" }).delete();
        await user.where({ id: "3" }).delete();

        const remainingUsers = await user.all();
        expect(remainingUsers).toEqual([]);
    });
});

describeSeq("Complex CRUD Workflows", () => {
    it("should perform complete CRUD lifecycle", async () => {
        // CREATE
        const userData = { id: "1", name: "John Doe" };
        const created = await user.create(userData);
        expect(created?.values).toEqual(userData);

        // READ
        const read = await user.where({ id: "1" }).get();
        expect(read).toEqual(userData);

        // UPDATE
        const updatedData = { id: "1", name: "John Updated" };
        await user.where({ id: "1" }).update(updatedData);
        const afterUpdate = await user.where({ id: "1" }).get();
        expect(afterUpdate).toEqual(updatedData);

        // DELETE
        await user.where({ id: "1" }).delete();
        const afterDelete = await user.where({ id: "1" }).get();
        expect(afterDelete).toBeUndefined();
    });

    it("should handle multiple operations on different records", async () => {
        // Create multiple users
        await user.create({ id: "1", name: "User 1" });
        await user.create({ id: "2", name: "User 2" });
        await user.create({ id: "3", name: "User 3" });

        // Update one, delete another, read the third
        await user.where({ id: "1" }).update({ id: "1", name: "Updated User 1" });
        await user.where({ id: "2" }).delete();
        const user3 = await user.where({ id: "3" }).get();

        // Verify final state
        expect(await user.where({ id: "1" }).get()).toEqual({ id: "1", name: "Updated User 1" });
        expect(await user.where({ id: "2" }).get()).toBeUndefined();
        expect(user3).toEqual({ id: "3", name: "User 3" });

        const allUsers = await user.all();
        expect(allUsers).toHaveLength(2);
    });
});

describeSeq("Edge Cases and Error Handling", () => {
    it("should handle empty name values", async () => {
        const userData = { id: "1", name: "" };
        const created = await user.create(userData);
        expect(created?.values).toEqual(userData);

        const retrieved = await user.where({ id: "1" }).get();
        expect(retrieved).toEqual(userData);
    });

    it("should handle special characters in names", async () => {
        const userData = { id: "1", name: "John O'Malley-Smith & Co." };
        const created = await user.create(userData);
        expect(created?.values).toEqual(userData);

        const retrieved = await user.where({ id: "1" }).get();
        expect(retrieved).toEqual(userData);
    });

    it("should maintain consistent state across operations", async () => {
        // Create initial data
        await user.create({ id: "1", name: "User 1" });
        await user.create({ id: "2", name: "User 2" });

        let currentCount = (await user.all()).length;
        expect(currentCount).toBe(2);

        // Perform mixed operations
        await user.create({ id: "3", name: "User 3" });
        currentCount = (await user.all()).length;
        expect(currentCount).toBe(3);

        await user.where({ id: "1" }).delete();
        currentCount = (await user.all()).length;
        expect(currentCount).toBe(2);

        await user.where({ id: "2" }).update({ id: "2", name: "Updated User 2" });
        currentCount = (await user.all()).length;
        expect(currentCount).toBe(2);
    });
});