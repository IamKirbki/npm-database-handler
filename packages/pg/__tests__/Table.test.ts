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

// interface JoinedUserOrder {
//     id: number;
//     name: string;
//     email: string;
//     age: number;
//     user_id: number;
//     total: number;
//     status?: string;
// }

// interface CompleteJoinResult {
//     id: number;
//     name: string;
//     email: string;
//     total: number;
//     status: string;
//     product_name: string;
//     price: number;
//     category_name: string;
// }

describe('Table', () => {
    const testDbPath = path.join(__dirname, '..', 'test-table.db');
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

    describe('Drop', () => {
        it('should drop the table', () => {
            const table = db.Table('users');

            const columnsBeforeDrop = table.TableColumnInformation;
            expect(columnsBeforeDrop.length).toBeGreaterThan(0);

            table.Drop();
            
            const columnsAfterDrop = table.TableColumnInformation;
            expect(columnsAfterDrop.length).toBe(0);
        });
    });

    describe('Insert', () => {
        it('should insert a single record', () => {
            const table = db.Table('users');
            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
            const records = table.Records();
            expect(records.length).toBe(1);
            expect((records[0].values as UserRecord).name).toBe('John');

        });

        it('should insert multiple records', () => {
            const table = db.Table('users');

            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });
            table.Insert({ name: 'Jane', email: 'jane@example.com', age: 25 });

            const records = table.Records();
            expect(records.length).toBe(2);
        });
    });

    describe('Records', () => {
        beforeEach(() => {
            const table = db.Table('users');
            table.Insert({
                name: 'John',
                email: 'john@example.com',
                age: 30
            });
            table.Insert({
                name: 'Jane',
                email: 'jane@example.com',
                age: 25
            });
            table.Insert({
                name: 'Bob',
                email: 'bob@example.com',
                age: 35
            });
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
            expect((records[0].values as UserRecord).name).toBe('John');
        });

        it('should limit records', () => {
            const table = db.Table('users');
            const records = table.Records({ limit: 2 });

            expect(records.length).toBe(2);
        });

        it('should order records', () => {
            const table = db.Table('users');
            const records = table.Records({ orderBy: 'age DESC' });

            expect((records[0].values as UserRecord).age).toBe(35);
            expect((records[2].values as UserRecord).age).toBe(25);
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
            expect((record?.values as UserRecord).name).toBe('John');
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
            table.Insert({
                name: 'John',
                email: 'john@example.com',
                age: 30
            });
            table.Insert({
                name: 'Jane',
                email: 'jane@example.com',
                age: 25
            });

            expect(table.RecordsCount).toBe(2);
        });

        it('should return 0 for empty table', () => {
            const table = db.Table('users');
            expect(table.RecordsCount).toBe(0);
        });
    });

    describe('Records Error Cases', () => {
        it('should return empty array for invalid where clause', () => {
            const table = db.Table('users');
            table.Insert({ name: 'John', email: 'john@example.com', age: 30 });

            const records = table.Records({ where: { name: 'NonExistent' } });
            expect(records).toHaveLength(0);
        });
    });

    // describe('InnerJoin', () => {
    //     beforeEach(() => {
    //         // Create users table
    //         const usersTable = db.Table('users');
    //         usersTable.Insert([
    //             { name: 'John', email: 'john@example.com', age: 30 },
    //             { name: 'Jane', email: 'jane@example.com', age: 25 },
    //             { name: 'Bob', email: 'bob@example.com', age: 35 }
    //         ]);

    //         // Create orders table
    //         db.CreateTable('orders', {
    //             id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    //             user_id: 'INTEGER NOT NULL',
    //             total: 'REAL NOT NULL',
    //             status: 'TEXT'
    //         });

    //         const ordersTable = db.Table('orders');
    //         ordersTable.Insert([
    //             { user_id: 1, total: 99.99, status: 'completed' },
    //             { user_id: 1, total: 149.99, status: 'pending' },
    //             { user_id: 2, total: 79.99, status: 'completed' },
    //             { user_id: 3, total: 199.99, status: 'completed' }
    //         ]);

    //         // Create products table for nested join tests
    //         db.CreateTable('products', {
    //             id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    //             order_id: 'INTEGER NOT NULL',
    //             name: 'TEXT NOT NULL',
    //             price: 'REAL NOT NULL'
    //         });

    //         const productsTable = db.Table('products');
    //         productsTable.Insert([
    //             { order_id: 1, name: 'Widget A', price: 49.99 },
    //             { order_id: 1, name: 'Widget B', price: 50.00 },
    //             { order_id: 2, name: 'Gadget C', price: 149.99 },
    //             { order_id: 3, name: 'Tool D', price: 79.99 }
    //         ]);
    //     });

    //     it('should perform simple INNER JOIN between two tables', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin({
    //             joinType: 'INNER',
    //             fromTable: ordersTable,
    //             on: { user_id: 'id' }
    //         });

    //         expect(results).toBeDefined();
    //         expect(results.length).toBeGreaterThan(0);
    //     });

    //     it('should join tables and return correct data', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin<JoinedUserOrder>({
    //             fromTable: ordersTable,
    //             joinType: 'INNER',
    //             on: { user_id: 'id' }
    //         });

    //         // Should have 4 results (total orders)
    //         expect(results.length).toBe(4);

    //         // Verify data structure contains fields from both tables
    //         const firstResult = results[0].values;
    //         expect(firstResult).toHaveProperty('name');
    //         expect(firstResult).toHaveProperty('total');
    //     });

    //     it('should support multiple INNER JOINs', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         // Create addresses table
    //         db.CreateTable('addresses', {
    //             id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    //             user_id: 'INTEGER NOT NULL',
    //             city: 'TEXT NOT NULL'
    //         });

    //         const addressesTable = db.Table('addresses');
    //         addressesTable.Insert([
    //             { user_id: 1, city: 'New York' },
    //             { user_id: 2, city: 'Los Angeles' },
    //             { user_id: 3, city: 'Chicago' }
    //         ]);

    //         const results = usersTable.InnerJoin([
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { fromTable: addressesTable, joinType: 'INNER', on: { user_id: 'id' } }
    //         ]);

    //         expect(results).toBeDefined();
    //         expect(results.length).toBeGreaterThan(0);
    //     });

    //     it('should support nested INNER JOINs', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');
    //         const productsTable = db.Table('products');

    //         const results = usersTable.InnerJoin(
    //             [
    //                 {
    //                     fromTable: ordersTable,
    //                     joinType: 'INNER',
    //                     on: { user_id: 'id' },
    //                 },
    //                 {
    //                     fromTable: productsTable,
    //                     joinType: 'INNER',
    //                     on: { order_id: 'id' }
    //                 }
    //             ]
    //         );

    //         expect(results).toBeDefined();
    //         expect(results.length).toBeGreaterThan(0);
    //     });

    //     it('should support select option with INNER JOIN', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin<JoinedUserOrder>(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { select: 'users.name, orders.total' }
    //         );

    //         expect(results).toBeDefined();
    //         expect(results.length).toBe(4);

    //         // Should only have selected columns
    //         const firstResult = results[0].values;
    //         expect(firstResult).toHaveProperty('name');
    //         expect(firstResult).toHaveProperty('total');
    //     });

    //     it('should support orderBy option with INNER JOIN', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin<JoinedUserOrder>(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { orderBy: 'orders.total DESC' }
    //         );

    //         expect(results).toBeDefined();
    //         expect(results.length).toBe(4);

    //         // First result should have highest total
    //         expect(results[0].values.total).toBeGreaterThanOrEqual(results[1].values.total);
    //     });

    //     it('should support limit option with INNER JOIN', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { limit: 2 }
    //         );

    //         expect(results.length).toBe(2);
    //     });

    //     it('should support offset option with INNER JOIN', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { limit: 2, offset: 2 }
    //         );

    //         expect(results.length).toBe(2); // 4 total - 2 offset = 2
    //     });

    //     it('should combine multiple query options with INNER JOIN', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         const results = usersTable.InnerJoin(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             {
    //                 select: 'users.name, orders.total',
    //                 orderBy: 'orders.total DESC',
    //                 limit: 2,
    //                 offset: 1
    //             }
    //         );

    //         expect(results.length).toBe(2);
    //     });

    //     // it('should use all INNER JOIN features together - comprehensive test', () => {
    //     //     const usersTable = db.Table('users');
    //     //     const ordersTable = db.Table('orders');
    //     //     const productsTable = db.Table('products');

    //     //     // Create additional test data for a more complex scenario
    //     //     db.CreateTable('categories', {
    //     //         id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    //     //         name: 'TEXT NOT NULL'
    //     //     });

    //     //     const categoriesTable = db.Table('categories');
    //     //     categoriesTable.Insert([
    //     //         { name: 'Electronics' },
    //     //         { name: 'Books' },
    //     //         { name: 'Clothing' }
    //     //     ]);

    //     //     // Add category_id to products
    //     //     db.db.exec('ALTER TABLE products ADD COLUMN category_id INTEGER');
    //     //     db.db.exec('UPDATE products SET category_id = 1 WHERE id IN (1, 2)');
    //     //     db.db.exec('UPDATE products SET category_id = 2 WHERE id = 3');
    //     //     db.db.exec('UPDATE products SET category_id = 3 WHERE id = 4');

    //     //     // Complex INNER JOIN with multiple tables using array syntax with WHERE clause
    //     //     // users -> orders -> products -> categories
    //     //     const results = usersTable.InnerJoin<CompleteJoinResult>(
    //     //         [
    //     //             {
    //     //                 fromTable: ordersTable,
    //     //                 joinType: 'INNER',
    //     //                 on: { user_id: 'id' }
    //     //             },
    //     //             {
    //     //                 fromTable: productsTable,
    //     //                 joinType: 'INNER',
    //     //                 on: { order_id: 'id' }
    //     //             },
    //     //             {
    //     //                 fromTable: categoriesTable,
    //     //                 joinType: 'INNER',
    //     //                 on: { id: 'category_id' }
    //     //             }
    //     //         ],
    //     //         {
    //     //             select: 'users.name, users.email, orders.total, orders.status, products.name as product_name, products.price, categories.name as category_name',
    //     //             where: { email: 'john' },
    //     //             orderBy: 'orders.total DESC, products.price ASC',
    //     //             limit: 3,
    //     //             offset: 0
    //     //         }
    //     //     );

    //     //     // Verify results
    //     //     expect(results).toBeDefined();
    //     //     expect(results.length).toBeGreaterThan(0);
    //     //     expect(results.length).toBeLessThanOrEqual(3); // Respects limit
            
    //     //     // Verify WHERE clause - all results should have email 'john'
    //     //     results.forEach(result => {
    //     //         expect(result.values.email).toBe('john');
    //     //     });

    //     //     // Verify data structure includes fields from all joined tables
    //     //     const firstResult = results[0].values;
    //     //     expect(firstResult).toHaveProperty('name'); // from users
    //     //     expect(firstResult).toHaveProperty('email'); // from users
    //     //     expect(firstResult).toHaveProperty('total'); // from orders
    //     //     expect(firstResult).toHaveProperty('status'); // from orders
    //     //     expect(firstResult).toHaveProperty('product_name'); // from products (aliased)
    //     //     expect(firstResult).toHaveProperty('price'); // from products
    //     //     expect(firstResult).toHaveProperty('category_name'); // from categories (aliased)

    //     //     // Verify ordering - should be ordered by total DESC first
    //     //     if (results.length > 1) {
    //     //         expect(results[0].values.total).toBeGreaterThanOrEqual(results[1].values.total);
    //     //     }

    //     //     // Verify we have meaningful data
    //     //     expect(firstResult.name).toBeTruthy();
    //     //     expect(firstResult.product_name).toBeTruthy();
    //     //     expect(firstResult.category_name).toBeTruthy();
    //     // });
    // });

    // describe('InnerJoin Error Cases', () => {
    //     beforeEach(() => {
    //         // Create test tables
    //         const usersTable = db.Table('users');
    //         usersTable.Insert({ name: 'John', email: 'john@example.com', age: 30 });

    //         db.CreateTable('orders', {
    //             id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    //             user_id: 'INTEGER NOT NULL',
    //             total: 'REAL NOT NULL'
    //         });
    //     });

    //     it('should throw error when joining with non-existent table', () => {
    //         expect(() => {
    //             db.Table('nonexistent_table');
    //         }).toThrow('does not exist in the database');
    //     });

    //     it('should return empty array when no matching records in join', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         // No orders exist, so join should return empty
    //         const results = usersTable.InnerJoin({
    //             fromTable: ordersTable,
    //             joinType: 'INNER',
    //             on: { user_id: 'id' }
    //         });

    //         expect(results).toBeDefined();
    //         expect(results.length).toBe(0);
    //     });

    //     it('should handle invalid ON clause gracefully', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         // This will create an invalid SQL query
    //         expect(() => {
    //             usersTable.InnerJoin({
    //                 fromTable: ordersTable,
    //                 joinType: 'INNER',
    //                 on: {} // Empty on clause
    //             });
    //         }).toThrow();
    //     });

    //     it('should throw error for invalid select columns', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         ordersTable.Insert({ user_id: 1, total: 99.99 });

    //         expect(() => {
    //             usersTable.InnerJoin(
    //                 { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //                 { select: 'nonexistent.column' }
    //             );
    //         }).toThrow();
    //     });

    //     it('should throw error for invalid orderBy column', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         ordersTable.Insert({ user_id: 1, total: 99.99 });

    //         expect(() => {
    //             usersTable.InnerJoin(
    //                 { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //                 { orderBy: 'nonexistent_column' }
    //             );
    //         }).toThrow();
    //     });

    //     it('should handle negative limit gracefully', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         ordersTable.Insert({ user_id: 1, total: 99.99 });

    //         // SQLite treats negative limit as no limit
    //         const results = usersTable.InnerJoin(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { limit: -1 }
    //         );

    //         expect(results).toBeDefined();
    //     });

    //     it('should handle negative offset gracefully', () => {
    //         const usersTable = db.Table('users');
    //         const ordersTable = db.Table('orders');

    //         ordersTable.Insert({ user_id: 1, total: 99.99 });

    //         // SQLite treats negative offset as 0
    //         const results = usersTable.InnerJoin(
    //             { fromTable: ordersTable, joinType: 'INNER', on: { user_id: 'id' } },
    //             { offset: -1 }
    //         );

    //         expect(results).toBeDefined();
    //         expect(results.length).toBe(1);
    //     });

    //     it('should throw error when joining table with itself without alias', () => {
    //         const usersTable = db.Table('users');

    //         // Self-join without proper aliasing should fail
    //         expect(() => {
    //             usersTable.InnerJoin({
    //                 fromTable: usersTable,
    //                 joinType: 'INNER',
    //                 on: { id: 'id' }
    //             });
    //         }).toThrow();
    //     });
    // });
});
