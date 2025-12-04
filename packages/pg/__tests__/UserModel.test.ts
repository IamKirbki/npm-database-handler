import { describe, it, expect, beforeEach, afterEach } from "vitest";
import User from "@core/abstract/User";
import { BetterSqlite3Database } from '../src/index';
import BetterSqlite3Adapter from '../src/PostGresAdapter';
import path from "path";
import fs from 'fs';
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("User Model CRUD Tests", () => {
    let user: User;
    let db: BetterSqlite3Database;
    let adapter: BetterSqlite3Adapter;
    let testDbPath: string;

    beforeEach(() => {
        // Create unique test database for each test
        testDbPath = path.join(__dirname, '..', `test-${Date.now()}-${Math.random()}.db`);
        db = new BetterSqlite3Database(testDbPath);
        db.CreateTable("User", {
            id: "TEXT PRIMARY KEY",
            name: "TEXT"
        });
        adapter = new BetterSqlite3Adapter();
        adapter.connect(testDbPath);
        user = new User(adapter);
    });

    afterEach(() => {
        // Close database connection before cleanup
        adapter.close();
        
        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe("CREATE Operations", () => {
        it("should create a new user", () => {
            const userData = { id: "1", name: "John Doe" };
            const createdRecord = user.create(userData);

            expect(createdRecord).toBeDefined();
            expect(createdRecord?.values).toEqual(userData);
        });

        it("should create multiple users", () => {
            const users = [
                { id: "1", name: "John Doe" },
                { id: "2", name: "Jane Smith" },
                { id: "3", name: "Bob Wilson" }
            ];

            users.forEach(userData => {
                const createdRecord = user.create(userData);
                expect(createdRecord?.values).toEqual(userData);
            });

            const allUsers = user.all();
            expect(allUsers).toHaveLength(3);
        });
    });

    describe("READ Operations", () => {
        beforeEach(() => {
            // Setup test data
            user.create({ id: "1", name: "John Doe" });
            user.create({ id: "2", name: "Jane Smith" });
            user.create({ id: "3", name: "Bob Wilson" });
        });

        it("should read a single user by ID", () => {
            const foundUser = user.where({ id: "1" }).get();
            expect(foundUser).toEqual({ id: "1", name: "John Doe" });
        });

        it("should read a single user by name", () => {
            const foundUser = user.where({ name: "Jane Smith" }).get();
            expect(foundUser).toEqual({ id: "2", name: "Jane Smith" });
        });

        it("should return undefined for non-existent user", () => {
            const foundUser = user.where({ id: "999" }).get();
            expect(foundUser).toBeUndefined();
        });

        it("should read all users", () => {
            const allUsers = user.all();
            expect(allUsers).toHaveLength(3);
            expect(allUsers).toContainEqual({ id: "1", name: "John Doe" });
            expect(allUsers).toContainEqual({ id: "2", name: "Jane Smith" });
            expect(allUsers).toContainEqual({ id: "3", name: "Bob Wilson" });
        });

        it("should return empty array when no users exist", () => {
            // Clear all users first
            const allUsers = user.all();
            allUsers.forEach(u => {
                user.where({ id: u.id }).delete();
            });

            const emptyResult = user.all();
            expect(emptyResult).toEqual([]);
        });
    });

    describe("UPDATE Operations", () => {
        beforeEach(() => {
            user.create({ id: "1", name: "John Doe" });
            user.create({ id: "2", name: "Jane Smith" });
        });

        it("should update user name", () => {
            user.where({ id: "1" }).update({ id: "1", name: "John Updated" });

            const updatedUser = user.where({ id: "1" }).get();
            expect(updatedUser).toEqual({ id: "1", name: "John Updated" });
        });

        it("should update user with new data", () => {
            const newData = { id: "2", name: "Jane Updated Smith" };
            user.where({ id: "2" }).update(newData);

            const updatedUser = user.where({ id: "2" }).get();
            expect(updatedUser).toEqual(newData);
        });

        it("should maintain data integrity after update", () => {
            user.where({ id: "1" }).update({ id: "1", name: "Updated Name" });

            // Verify other records are unchanged
            const otherUser = user.where({ id: "2" }).get();
            expect(otherUser).toEqual({ id: "2", name: "Jane Smith" });

            // Verify total count is maintained
            const allUsers = user.all();
            expect(allUsers).toHaveLength(2);
        });
    });

    describe("DELETE Operations", () => {
        beforeEach(() => {
            user.create({ id: "1", name: "John Doe" });
            user.create({ id: "2", name: "Jane Smith" });
            user.create({ id: "3", name: "Bob Wilson" });
        });

        it("should delete a user by ID", () => {
            user.where({ id: "1" }).delete();

            const deletedUser = user.where({ id: "1" }).get();
            expect(deletedUser).toBeUndefined();

            // Verify other users still exist
            const remainingUsers = user.all();
            expect(remainingUsers).toHaveLength(2);
        });

        it("should delete a user by name", () => {
            user.where({ name: "Jane Smith" }).delete();

            const deletedUser = user.where({ name: "Jane Smith" }).get();
            expect(deletedUser).toBeUndefined();

            // Verify remaining users
            const remainingUsers = user.all();
            expect(remainingUsers).toHaveLength(2);
        });

        it("should delete all users sequentially", () => {
            // Delete all users one by one
            user.where({ id: "1" }).delete();
            user.where({ id: "2" }).delete();
            user.where({ id: "3" }).delete();

            const remainingUsers = user.all();
            expect(remainingUsers).toEqual([]);
        });
    });

    describe("Complex CRUD Workflows", () => {
        it("should perform complete CRUD lifecycle", () => {
            // CREATE
            const userData = { id: "1", name: "John Doe" };
            const created = user.create(userData);
            expect(created?.values).toEqual(userData);

            // READ
            const read = user.where({ id: "1" }).get();
            expect(read).toEqual(userData);

            // UPDATE
            const updatedData = { id: "1", name: "John Updated" };
            user.where({ id: "1" }).update(updatedData);
            const afterUpdate = user.where({ id: "1" }).get();
            expect(afterUpdate).toEqual(updatedData);

            // DELETE
            user.where({ id: "1" }).delete();
            const afterDelete = user.where({ id: "1" }).get();
            expect(afterDelete).toBeUndefined();
        });

        it("should handle multiple operations on different records", () => {
            // Create multiple users
            user.create({ id: "1", name: "User 1" });
            user.create({ id: "2", name: "User 2" });
            user.create({ id: "3", name: "User 3" });

            // Update one, delete another, read the third
            user.where({ id: "1" }).update({ id: "1", name: "Updated User 1" });
            user.where({ id: "2" }).delete();
            const user3 = user.where({ id: "3" }).get();

            // Verify final state
            expect(user.where({ id: "1" }).get()).toEqual({ id: "1", name: "Updated User 1" });
            expect(user.where({ id: "2" }).get()).toBeUndefined();
            expect(user3).toEqual({ id: "3", name: "User 3" });

            const allUsers = user.all();
            expect(allUsers).toHaveLength(2);
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle empty name values", () => {
            const userData = { id: "1", name: "" };
            const created = user.create(userData);
            expect(created?.values).toEqual(userData);

            const retrieved = user.where({ id: "1" }).get();
            expect(retrieved).toEqual(userData);
        });

        it("should handle special characters in names", () => {
            const userData = { id: "1", name: "John O'Malley-Smith & Co." };
            const created = user.create(userData);
            expect(created?.values).toEqual(userData);

            const retrieved = user.where({ id: "1" }).get();
            expect(retrieved).toEqual(userData);
        });

        it("should maintain consistent state across operations", () => {
            // Create initial data
            user.create({ id: "1", name: "User 1" });
            user.create({ id: "2", name: "User 2" });

            let currentCount = user.all().length;
            expect(currentCount).toBe(2);

            // Perform mixed operations
            user.create({ id: "3", name: "User 3" });
            currentCount = user.all().length;
            expect(currentCount).toBe(3);

            user.where({ id: "1" }).delete();
            currentCount = user.all().length;
            expect(currentCount).toBe(2);

            user.where({ id: "2" }).update({ id: "2", name: "Updated User 2" });
            currentCount = user.all().length;
            expect(currentCount).toBe(2);
        });
    });
});