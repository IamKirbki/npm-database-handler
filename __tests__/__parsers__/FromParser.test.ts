import { describe, it, expect } from 'vitest';
import FromParser from '../../src/helpers/parsers/FromParser.js';

describe('FromParser', () => {
    describe('ParseTables - Basic FROM Clause', () => {
        it('should parse single table', () => {
            const parser = new FromParser('SELECT * FROM users');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse table with schema qualifier', () => {
            const parser = new FromParser('SELECT * FROM main.users');
            expect(parser.FromValues).toEqual([{ tableName: 'main.users' }]);
        });

        it('should parse table with database and schema qualifier', () => {
            const parser = new FromParser('SELECT * FROM database.schema.users');
            expect(parser.FromValues).toEqual([{ tableName: 'database.schema.users' }]);
        });

        it('should parse multiple tables separated by comma', () => {
            const parser = new FromParser('SELECT * FROM users, orders, products');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }, { tableName: 'orders' }, { tableName: 'products' }]);
        });

        it('should parse multiple schema-qualified tables', () => {
            const parser = new FromParser('SELECT * FROM main.users, main.orders');
            expect(parser.FromValues).toEqual([{ tableName: 'main.users' }, { tableName: 'main.orders' }]);
        });
    });

    describe('ParseTables - Table Aliases', () => {
        it('should parse table with AS alias', () => {
            const parser = new FromParser('SELECT * FROM users AS u');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }]);
        });

        it('should parse table with alias without AS keyword', () => {
            const parser = new FromParser('SELECT * FROM users u');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }]);
        });

        it('should parse schema-qualified table with alias', () => {
            const parser = new FromParser('SELECT * FROM main.users AS u');
            expect(parser.FromValues).toEqual([{ tableName: 'main.users', alias: 'u' }]);
        });

        it('should parse multiple tables with aliases', () => {
            const parser = new FromParser('SELECT * FROM users AS u, orders AS o');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }, { tableName: 'orders', alias: 'o' }]);
        });

        it('should parse mixed aliased and non-aliased tables', () => {
            const parser = new FromParser('SELECT * FROM users AS u, orders, products p');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }, { tableName: 'orders' }, { tableName: 'products', alias: 'p' }]);
        });
    });

    describe('ParseTables - JOINs', () => {
        it('should parse INNER JOIN', () => {
            const parser = new FromParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse LEFT JOIN', () => {
            const parser = new FromParser('SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse LEFT OUTER JOIN', () => {
            const parser = new FromParser('SELECT * FROM users LEFT OUTER JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse RIGHT JOIN', () => {
            const parser = new FromParser('SELECT * FROM users RIGHT JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse RIGHT OUTER JOIN', () => {
            const parser = new FromParser('SELECT * FROM users RIGHT OUTER JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FULL JOIN', () => {
            const parser = new FromParser('SELECT * FROM users FULL JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FULL OUTER JOIN', () => {
            const parser = new FromParser('SELECT * FROM users FULL OUTER JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse CROSS JOIN', () => {
            const parser = new FromParser('SELECT * FROM users CROSS JOIN orders');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse JOIN without type specified', () => {
            const parser = new FromParser('SELECT * FROM users JOIN orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse multiple JOINs', () => {
            const parser = new FromParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id LEFT JOIN products ON orders.product_id = products.id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse JOINs with table aliases', () => {
            const parser = new FromParser('SELECT * FROM users AS u INNER JOIN orders AS o ON u.id = o.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }]);
        });

        it('should parse JOINs with schema-qualified tables', () => {
            const parser = new FromParser('SELECT * FROM main.users JOIN main.orders ON users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'main.users' }]);
        });
    });

    describe('ParseTables - Subqueries', () => {
        it('should parse subquery in FROM clause', () => {
            const parser = new FromParser('SELECT * FROM (SELECT id, name FROM users WHERE active = 1)');
            expect(parser.FromValues).toBeDefined();
        });

        it('should parse subquery with alias', () => {
            const parser = new FromParser('SELECT * FROM (SELECT id, name FROM users WHERE active = 1) AS active_users');
            expect(parser.FromValues).toBeDefined();
        });

        it('should parse multiple subqueries', () => {
            const parser = new FromParser('SELECT * FROM (SELECT id FROM users) AS u, (SELECT id FROM orders) AS o');
            expect(parser.FromValues).toBeDefined();
        });

        it('should parse JOIN with subquery', () => {
            const parser = new FromParser('SELECT * FROM users JOIN (SELECT user_id, COUNT(*) FROM orders GROUP BY user_id) AS order_counts ON users.id = order_counts.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });
    });

    describe('ParseTables - WITH WHERE Clause', () => {
        it('should parse FROM with WHERE clause', () => {
            const parser = new FromParser('SELECT * FROM users WHERE id = @id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with complex WHERE clause', () => {
            const parser = new FromParser('SELECT * FROM users WHERE status = @status AND age > 18 AND role IN (@role1, @role2)');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse multiple tables with WHERE clause', () => {
            const parser = new FromParser('SELECT * FROM users, orders WHERE users.id = orders.user_id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }, { tableName: 'orders' }]);
        });
    });

    describe('ParseTables - WITH GROUP BY Clause', () => {
        it('should parse FROM with GROUP BY', () => {
            const parser = new FromParser('SELECT status, COUNT(*) FROM users GROUP BY status');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with GROUP BY and HAVING', () => {
            const parser = new FromParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with WHERE and GROUP BY', () => {
            const parser = new FromParser('SELECT status, COUNT(*) FROM users WHERE active = 1 GROUP BY status');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });
    });

    describe('ParseTables - WITH ORDER BY Clause', () => {
        it('should parse FROM with ORDER BY', () => {
            const parser = new FromParser('SELECT * FROM users ORDER BY created_at');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with ORDER BY DESC', () => {
            const parser = new FromParser('SELECT * FROM users ORDER BY created_at DESC');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with ORDER BY ASC', () => {
            const parser = new FromParser('SELECT * FROM users ORDER BY name ASC');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with multiple ORDER BY columns', () => {
            const parser = new FromParser('SELECT * FROM users ORDER BY status, created_at DESC, name ASC');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with WHERE and ORDER BY', () => {
            const parser = new FromParser('SELECT * FROM users WHERE active = 1 ORDER BY created_at');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });
    });

    describe('ParseTables - WITH LIMIT Clause', () => {
        it('should parse FROM with LIMIT', () => {
            const parser = new FromParser('SELECT * FROM users LIMIT 10');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with LIMIT and OFFSET', () => {
            const parser = new FromParser('SELECT * FROM users LIMIT 10 OFFSET 20');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with WHERE and LIMIT', () => {
            const parser = new FromParser('SELECT * FROM users WHERE active = 1 LIMIT 5');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse FROM with ORDER BY and LIMIT', () => {
            const parser = new FromParser('SELECT * FROM users ORDER BY created_at LIMIT 20');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });
    });

    describe('ParseTables - Complex Queries', () => {
        it('should parse complex query with all clauses', () => {
            const parser = new FromParser('SELECT name, email FROM users WHERE status = @status ORDER BY created_at LIMIT 10');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse complex query with JOIN, WHERE, ORDER BY, and LIMIT', () => {
            const parser = new FromParser('SELECT u.name, o.total FROM users AS u INNER JOIN orders AS o ON u.id = o.user_id WHERE o.status = @status ORDER BY o.total DESC LIMIT 10');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }]);
        });

        it('should parse query with multiple JOINs and complex WHERE', () => {
            const parser = new FromParser('SELECT * FROM users u JOIN orders o ON u.id = o.user_id JOIN products p ON o.product_id = p.id WHERE u.active = 1 AND o.status = @status');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }]);
        });

        it('should parse query with GROUP BY, HAVING, ORDER BY, and LIMIT', () => {
            const parser = new FromParser('SELECT status, COUNT(*) FROM users WHERE active = 1 GROUP BY status HAVING COUNT(*) > 5 ORDER BY COUNT(*) DESC LIMIT 10');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });
    });

    describe('ParseTables - Edge Cases', () => {
        it('should handle case-insensitive FROM', () => {
            const parser = new FromParser('SELECT * from users');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should handle case-insensitive AS', () => {
            const parser = new FromParser('SELECT * FROM users as u');
            expect(parser.FromValues).toEqual([{ tableName: 'users', alias: 'u' }]);
        });

        it('should handle extra whitespace', () => {
            const parser = new FromParser('SELECT   *   FROM   users   WHERE   id = @id');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should handle tabs and multiple spaces', () => {
            const parser = new FromParser('SELECT *\t\tFROM\t\tusers');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should handle newlines in query', () => {
            const parser = new FromParser(`SELECT * 
                FROM users 
                WHERE id = @id 
                ORDER BY created_at 
                LIMIT 10`);

            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should handle query ending with semicolon', () => {
            const parser = new FromParser('SELECT * FROM users;');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should handle table names with underscores', () => {
            const parser = new FromParser('SELECT * FROM user_accounts');
            expect(parser.FromValues).toEqual([{ tableName: 'user_accounts' }]);
        });

        it('should handle table names with numbers', () => {
            const parser = new FromParser('SELECT * FROM table1, table2');
            expect(parser.FromValues).toEqual([{ tableName: 'table1' }, { tableName: 'table2' }]);
        });

        it('should throw error when FROM clause is missing', () => {
            expect(() => {
                const parser = new FromParser('SELECT name, email');
                return parser.FromValues;
            }).toThrow('Invalid SQL query: FROM clause not found.');
        });
    });

    describe('ParseTables - UNION Queries', () => {
        it('should parse first table in UNION query', () => {
            const parser = new FromParser('SELECT * FROM users UNION SELECT * FROM archived_users');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });

        it('should parse UNION ALL query', () => {
            const parser = new FromParser('SELECT * FROM users UNION ALL SELECT * FROM archived_users');
            expect(parser.FromValues).toEqual([{ tableName: 'users' }]);
        });
    });
});
