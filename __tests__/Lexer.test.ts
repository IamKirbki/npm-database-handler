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

    describe('Table Creation/Deletion Queries', () => {
        it('should parse CREATE TABLE statements', () => {
            const lexer = new Lexer('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });

        it('should parse DROP TABLE statements', () => {
            const lexer = new Lexer('DROP TABLE IF EXISTS users');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });
    });

    describe('OR Conditions', () => {
        it('should parse WHERE with OR condition', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE status = @status OR role = @role');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['status = @status', 'role = @role']);
        });

        it('should parse WHERE with mixed AND/OR conditions', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE (status = @status OR role = @role) AND active = @active');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse ON with OR condition', () => {
            const lexer = new Lexer('SELECT * FROM users JOIN orders ON users.id = orders.user_id OR users.email = orders.email');
            const parts = lexer.QueryParts;
            expect(parts.on).toEqual(['users.id = orders.user_id', 'users.email = orders.email']);
        });
    });

    describe('Multiple JOINs', () => {
        it('should parse query with multiple JOINs', () => {
            const lexer = new Lexer('SELECT * FROM users JOIN orders ON users.id = orders.user_id JOIN products ON orders.product_id = products.id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.on).toBeDefined();
        });

        it('should parse query with three JOINs', () => {
            const lexer = new Lexer('SELECT * FROM users JOIN orders ON users.id = orders.user_id JOIN products ON orders.product_id = products.id JOIN categories ON products.category_id = categories.id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });
    });

    describe('Different JOIN Types', () => {
        it('should parse LEFT JOIN', () => {
            const lexer = new Lexer('SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.on).toEqual(['users.id = orders.user_id']);
        });

        it('should parse RIGHT JOIN', () => {
            const lexer = new Lexer('SELECT * FROM users RIGHT JOIN orders ON users.id = orders.user_id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.on).toEqual(['users.id = orders.user_id']);
        });

        it('should parse FULL OUTER JOIN', () => {
            const lexer = new Lexer('SELECT * FROM users FULL OUTER JOIN orders ON users.id = orders.user_id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.on).toEqual(['users.id = orders.user_id']);
        });

        it('should parse CROSS JOIN', () => {
            const lexer = new Lexer('SELECT * FROM users CROSS JOIN orders');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
        });

        it('should parse LEFT OUTER JOIN', () => {
            const lexer = new Lexer('SELECT * FROM users LEFT OUTER JOIN orders ON users.id = orders.user_id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.on).toEqual(['users.id = orders.user_id']);
        });
    });

    describe('Multiple Columns in ORDER BY', () => {
        it('should parse ORDER BY with multiple columns', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY created_at DESC, name ASC');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBeDefined();
        });

        it('should parse ORDER BY with three columns', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY status, created_at DESC, name');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBeDefined();
        });
    });

    describe('LIMIT with OFFSET', () => {
        it('should parse LIMIT with OFFSET', () => {
            const lexer = new Lexer('SELECT * FROM users LIMIT 10 OFFSET 20');
            const parts = lexer.QueryParts;
            expect(parts.limit).toBe(10);
            expect(parts.offset).toBeDefined();
        });

        it('should parse LIMIT with OFFSET and WHERE', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE active = @active LIMIT 5 OFFSET 10');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['active = @active']);
            expect(parts.limit).toBe(5);
            expect(parts.offset).toBeDefined();
        });

        it('should parse LIMIT with OFFSET and ORDER BY', () => {
            const lexer = new Lexer('SELECT * FROM users ORDER BY created_at LIMIT 20 OFFSET 40');
            const parts = lexer.QueryParts;
            expect(parts.orderBy).toBe('created_at');
            expect(parts.limit).toBe(20);
            expect(parts.offset).toBeDefined();
        });
    });

    describe('Aggregate Functions', () => {
        it('should parse COUNT function', () => {
            const lexer = new Lexer('SELECT COUNT(*) FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['COUNT(*)']);
        });

        it('should parse multiple aggregate functions', () => {
            const lexer = new Lexer('SELECT COUNT(*), MAX(age), MIN(age), AVG(salary) FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toContain('COUNT(*)');
            expect(parts.selector).toContain('MAX(age)');
            expect(parts.selector).toContain('MIN(age)');
            expect(parts.selector).toContain('AVG(salary)');
        });

        it('should parse aggregate with alias', () => {
            const lexer = new Lexer('SELECT COUNT(*) as total, AVG(age) as average_age FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toBeDefined();
        });

        it('should parse SUM function', () => {
            const lexer = new Lexer('SELECT SUM(amount) FROM orders');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['SUM(amount)']);
        });
    });

    describe('GROUP BY and HAVING', () => {
        it('should parse GROUP BY clause', () => {
            const lexer = new Lexer('SELECT status, COUNT(*) FROM users GROUP BY status');
            const parts = lexer.QueryParts;
            expect(parts.groupBy).toBeDefined();
        });

        it('should parse GROUP BY with multiple columns', () => {
            const lexer = new Lexer('SELECT status, role, COUNT(*) FROM users GROUP BY status, role');
            const parts = lexer.QueryParts;
            expect(parts.groupBy).toBeDefined();
        });

        it('should parse GROUP BY with HAVING', () => {
            const lexer = new Lexer('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5');
            const parts = lexer.QueryParts;
            expect(parts.groupBy).toBeDefined();
            expect(parts.having).toBeDefined();
        });

        it('should parse HAVING with parameter', () => {
            const lexer = new Lexer('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > @minCount');
            const parts = lexer.QueryParts;
            expect(parts.having).toBeDefined();
        });

        it('should parse GROUP BY with ORDER BY', () => {
            const lexer = new Lexer('SELECT status, COUNT(*) FROM users GROUP BY status ORDER BY COUNT(*) DESC');
            const parts = lexer.QueryParts;
            expect(parts.groupBy).toBeDefined();
            expect(parts.orderBy).toBeDefined();
        });
    });

    describe('Subqueries', () => {
        it('should parse subquery in WHERE with IN', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse subquery with EXISTS', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id)');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse subquery in FROM', () => {
            const lexer = new Lexer('SELECT * FROM (SELECT id, name FROM users WHERE active = @active) AS active_users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['*']);
        });
    });

    describe('DISTINCT Keyword', () => {
        it('should parse DISTINCT with single column', () => {
            const lexer = new Lexer('SELECT DISTINCT status FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['status']);
            expect(parts.distinct).toBe(true);
        });

        it('should parse DISTINCT with multiple columns', () => {
            const lexer = new Lexer('SELECT DISTINCT status, role FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toEqual(['status', 'role']);
            expect(parts.distinct).toBe(true);
        });

        it('should parse DISTINCT with WHERE', () => {
            const lexer = new Lexer('SELECT DISTINCT status FROM users WHERE active = @active');
            const parts = lexer.QueryParts;
            expect(parts.distinct).toBe(true);
            expect(parts.where).toEqual(['active = @active']);
        });
    });

    describe('Table Aliases', () => {
        it('should parse table alias with AS', () => {
            const lexer = new Lexer('SELECT u.name FROM users AS u');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.tableAlias).toBe('u');
        });

        it('should parse table alias without AS', () => {
            const lexer = new Lexer('SELECT u.name FROM users u');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.tableAlias).toBe('u');
        });

        it('should parse JOIN with table aliases', () => {
            const lexer = new Lexer('SELECT u.name, o.total FROM users AS u JOIN orders AS o ON u.id = o.user_id');
            const parts = lexer.QueryParts;
            expect(parts.table).toBe('users');
            expect(parts.tableAlias).toBe('u');
        });
    });

    describe('Functions in Clauses', () => {
        it('should parse function in WHERE clause', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE LOWER(name) = @name');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse function in SET clause', () => {
            const lexer = new Lexer('UPDATE users SET updated_at = datetime(@now) WHERE id = @id');
            const parts = lexer.QueryParts;
            expect(parts.set).toBeDefined();
        });

        it('should parse multiple functions in SELECT', () => {
            const lexer = new Lexer('SELECT UPPER(name), LOWER(email), LENGTH(description) FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toContain('UPPER(name)');
            expect(parts.selector).toContain('LOWER(email)');
            expect(parts.selector).toContain('LENGTH(description)');
        });
    });

    describe('Additional Operators', () => {
        it('should parse BETWEEN operator', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE age BETWEEN @minAge AND @maxAge');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse IN operator with parameters', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE status IN (@status1, @status2, @status3)');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse LIKE operator', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE name LIKE @pattern');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['name LIKE @pattern']);
        });

        it('should parse NOT LIKE operator', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE email NOT LIKE @pattern');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });

        it('should parse NOT IN operator', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE status NOT IN (@status1, @status2)');
            const parts = lexer.QueryParts;
            expect(parts.where).toBeDefined();
        });
    });

    describe('NULL Handling', () => {
        it('should parse IS NULL', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE email IS NULL');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['email IS NULL']);
        });

        it('should parse IS NOT NULL', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE email IS NOT NULL');
            const parts = lexer.QueryParts;
            expect(parts.where).toEqual(['email IS NOT NULL']);
        });

        it('should parse IS NULL with AND', () => {
            const lexer = new Lexer('SELECT * FROM users WHERE email IS NULL AND status = @status');
            const parts = lexer.QueryParts;
            expect(parts.where).toContain('email IS NULL');
            expect(parts.where).toContain('status = @status');
        });
    });

    describe('CASE Statements', () => {
        it('should parse simple CASE statement', () => {
            const lexer = new Lexer('SELECT CASE WHEN age > 18 THEN @adult ELSE @minor END FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toBeDefined();
        });

        it('should parse CASE with alias', () => {
            const lexer = new Lexer('SELECT name, CASE WHEN age > 18 THEN @adult ELSE @minor END as age_group FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toBeDefined();
        });

        it('should parse multiple CASE statements', () => {
            const lexer = new Lexer('SELECT CASE WHEN age > 18 THEN @adult ELSE @minor END, CASE WHEN status = @active THEN @yes ELSE @no END FROM users');
            const parts = lexer.QueryParts;
            expect(parts.selector).toBeDefined();
        });
    });

    describe('Multiple Row INSERT', () => {
        it('should parse INSERT with multiple value sets', () => {
            const lexer = new Lexer('INSERT INTO users (name) VALUES (@name1), (@name2), (@name3)');
            const parts = lexer.QueryParts;
            expect(parts.values).toBeDefined();
        });

        it('should parse INSERT with multiple columns and rows', () => {
            const lexer = new Lexer('INSERT INTO users (name, email) VALUES (@name1, @email1), (@name2, @email2)');
            const parts = lexer.QueryParts;
            expect(parts.values).toBeDefined();
        });
    });
});
