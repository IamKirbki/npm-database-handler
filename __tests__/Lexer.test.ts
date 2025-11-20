import { describe, it, expect } from 'vitest';
import Lexer from '../src/helpers/Lexer.js';

describe('Lexer', () => {
    describe('Constructor', () => {
        it('should accept a valid single statement', () => {
            const lexer = new Lexer('SELECT * FROM users');
            expect(lexer).toBeDefined();
            expect(lexer.query).toBe('SELECT * FROM users');
        });

        it('should throw error for multiple statements', () => {
            expect(() => {
                new Lexer('SELECT * FROM users; SELECT * FROM orders');
            }).toThrow('Only single statements are allowed. Multiple statements detected.');
        });

        it('should allow statement with semicolon at end', () => {
            const lexer = new Lexer('SELECT * FROM users;');
            expect(lexer).toBeDefined();
        });
    });

    describe('GetSelector', () => {
        it('should parse single column selector', () => {
            const lexer = new Lexer('SELECT name FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['name']);
        });

        it('should parse multiple column selectors', () => {
            const lexer = new Lexer('SELECT name, email, age FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['name', 'email', 'age']);
        });

        it('should parse asterisk selector', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['*']);
        });

        it('should parse table-qualified selectors', () => {
            const lexer = new Lexer('SELECT users.name, users.email FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['users.name', 'users.email']);
        });

        it('should parse aliased selectors', () => {
            const lexer = new Lexer('SELECT name as user_name, email FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['name as user_name', 'email']);
        });

        it('should return undefined for non-SELECT queries', () => {
            const lexer = new Lexer('INSERT INTO users (name) VALUES (@name)');
            const parts = lexer.QueryParts;
            expect(parts.selector).toBeUndefined();
        });
    });

    describe('GetFrom', () => {
        it('should parse FROM clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });

        it('should parse FROM with WHERE clause', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });

        it('should parse FROM with JOIN', () => {
            const lexer = new Lexer('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });

        it('should throw error when FROM is missing', () => {
            expect(() => {
                const lexer = new Lexer('SELECT *');
                lexer.QueryParts;
            }).toThrow('FROM clause is required.');
        });
    });

    describe('GetWhere', () => {
        it('should parse single WHERE condition', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['id = @id']);
        });

        it('should parse multiple WHERE conditions with AND', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE name = @name and age = @age');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['name = @name', 'age = @age']);
        });

        it('should parse WHERE with ORDER BY', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE status = @status ORDER BY created_at');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['status = @status']);
        });

        it('should parse WHERE with LIMIT', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE active = @active LIMIT 10');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['active = @active']);
        });

        it('should return undefined when no WHERE clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeUndefined();
        });

        it('should handle WHERE in UPDATE queries', () => {
            const lexer = new Lexer('UPDATE users SET name = @name WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['id = @id']);
        });

        it('should handle WHERE in DELETE queries', () => {
            const lexer = new Lexer('DELETE FROM users WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['id = @id']);
        });
    });

    describe('GetValues', () => {
        it('should parse single VALUES parameter', () => {
            const lexer = new Lexer('INSERT INTO users (name) VALUES (@name)');
            const parts = lexer.QueryParts;
            expect(parts.values).toEqual(['@name']);
        });

        it('should parse multiple VALUES parameters', () => {
            const lexer = new Lexer('INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
            const parts = lexer.QueryParts;
            expect(parts.values).toEqual(['@name', '@email', '@age']);
        });

        it('should return undefined when no VALUES clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.values).toBeUndefined();
        });
    });

    describe('GetSet', () => {
        it('should parse single SET parameter', () => {
            const lexer = new Lexer('UPDATE users SET name = @name WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.set).toEqual(['name = @name']);
        });

        it('should parse multiple SET parameters', () => {
            const lexer = new Lexer('UPDATE users SET name = @name, email = @email, age = @age WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.set).toEqual(['name = @name', 'email = @email', 'age = @age']);
        });

        it('should parse SET without WHERE', () => {
            const lexer = new Lexer('UPDATE users SET status = @status');
            const parts = lexer.QueryParts;
            expect(parts.set).toEqual(['status = @status']);
        });

        it('should return undefined when no SET clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.set).toBeUndefined();
        });
    });

    describe('GetOrderBy', () => {
        it('should parse ORDER BY clause', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY created_at');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBe('created_at');
        });

        it('should parse ORDER BY with DESC', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY created_at DESC');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBe('created_at');
        });

        it('should parse ORDER BY with ASC', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY name ASC');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBe('name');
        });

        it('should return undefined when no ORDER BY clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBeUndefined();
        });
    });

    describe('GetLimit', () => {
        it('should parse LIMIT clause', () => {
            const lexer = new Lexer('SELECT * FROM users LIMIT 10');
            const parts = lexer.QueryParts;
            expect(parts.limit).toBe(10);
        });

        it('should parse LIMIT with WHERE', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE active = @active LIMIT 5');
            const parts = lexer.QueryParts;
            expect(parts.limit).toBe(5);
        });

        it('should parse LIMIT with ORDER BY', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY created_at LIMIT 20');
            const parts = lexer.QueryParts;
            expect(parts.limit).toBe(20);
        });

        it('should return undefined when no LIMIT clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.limit).toBeUndefined();
        });
    });

    describe('GetOn', () => {
        it('should parse single ON condition', () => {
            const lexer = new Lexer('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id');
            const parts = lexer.QueryParts;
            expect(parts.on).toEqual(['users.id = orders.user_id']);
        });

        it('should parse multiple ON conditions with AND', () => {
            const lexer = new Lexer('SELECT * FROM users JOIN orders ON users.id = orders.user_id and users.company_id = orders.company_id');
            const parts = lexer.QueryParts;
            expect(parts.on).toEqual(['users.id = orders.user_id', 'users.company_id = orders.company_id']);
        });

        it('should parse ON with WHERE', () => {
            const lexer = new Lexer('SELECT * FROM users JOIN orders ON users.id = orders.user_id WHERE orders.status = @status');
            const parts = lexer.QueryParts;
            expect(parts.on).toEqual(['users.id = orders.user_id']);
        });

        it('should return undefined when no ON clause', () => {
            const lexer = new Lexer('SELECT * FROM users');
            const parts = lexer.QueryParts;
            expect(parts.on).toBeUndefined();
        });
    });

    describe('ValidateParameters', () => {
        it('should accept valid parameter format', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE id = @id');
            expect(() => lexer.QueryParts).not.toThrow();
        });

        it('should accept multiple valid parameters', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE name = @name and email = @email');
            expect(() => lexer.QueryParts).not.toThrow();
        });

        it('should throw error for parameter without @ symbol', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE id = id');
            expect(() => lexer.QueryParts).toThrow('Invalid parameter format');
        });

        it('should throw error for parameter mismatch', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE name = @email');
            expect(() => lexer.QueryParts).toThrow('Parameter value must reference the key');
        });

        it('should validate VALUES parameters', () => {
            const lexer = new Lexer('INSERT INTO users (name) VALUES (invalid)');
            expect(() => lexer.QueryParts).toThrow('Invalid value format: invalid. Expected format: @value');
        });

        it('should validate SET parameters', () => {
            const lexer = new Lexer('UPDATE users SET name = invalid WHERE id = @id');
            expect(() => lexer.QueryParts).toThrow('Invalid parameter format: name = invalid. Expected format: key = @value');
        });
    });

    describe('Complex Queries', () => {
        it('should parse complex SELECT with all clauses', () => {
            const lexer = new Lexer('SELECT name, email FROM users WHERE status = @status ORDER BY created_at LIMIT 10');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['name', 'email']);
            expect(parts.table).toBe('users');
            expect(parts.where).toEqual(['status = @status']);
            expect(parts.orderBy).toBe('created_at');
            expect(parts.limit).toBe(10);
        });

        it('should parse JOIN with WHERE and ORDER BY', () => {
            const lexer = new Lexer('SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id WHERE orders.status = @status ORDER BY orders.total');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['users.name', 'orders.total']);
            expect(parts.table).toBe('users');
            expect(parts.on).toEqual(['users.id = orders.user_id']);
            expect(parts.where).toEqual(['orders.status = @status']);
            expect(parts.orderBy).toBe('orders.total');
        });

        it('should parse UPDATE with multiple SET and WHERE', () => {
            const lexer = new Lexer('UPDATE users SET name = @name, email = @email, age = @age WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.set).toEqual(['name = @name', 'email = @email', 'age = @age']);
            expect(parts.where).toEqual(['id = @id']);
        });

        it('should parse INSERT with multiple columns', () => {
            const lexer = new Lexer('INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.values).toEqual(['@name', '@email', '@age']);
        });

        it('should handle case-insensitive keywords', () => {
            const lexer = new Lexer('select * from users where id = @id order by created_at limit 5');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['*']);
            expect(parts.table).toBe('users');
            expect(parts.where).toEqual(['id = @id']);
            expect(parts.orderBy).toBe('created_at');
            expect(parts.limit).toBe(5);
        });
    });

    describe('Edge Cases', () => {
        it('should handle extra whitespace', () => {
            const lexer = new Lexer('SELECT   *   FROM   users   WHERE   id = @id');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['*']);
            expect(parts.table).toBe('users');
            expect(parts.where).toEqual(['id = @id']);
        });

        it('should handle queries ending with semicolon', () => {
            const lexer = new Lexer('SELECT * FROM users;');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['*']);
            expect(parts.table).toBe('users');
        });

        it('should handle queries with newlines', () => {
            const lexer = new Lexer(`SELECT *
                FROM users
                WHERE id = @id
                ORDER BY created_at
                LIMIT 10`);
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['*']);
            expect(parts.table).toBe('users');
            expect(parts.where).toEqual(['id = @id']);
            expect(parts.orderBy).toBe('created_at');
            expect(parts.limit).toBe(10);
        });
    });
});
