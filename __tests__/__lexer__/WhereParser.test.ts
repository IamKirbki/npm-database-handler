import { describe, it, expect } from 'vitest';
import WhereParser from '../../src/helpers/parsers/WhereParser.js';

describe('WhereParser', () => {
    describe('ParseConditions - Basic Equality Operators', () => {
        it('should parse simple equality condition', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should parse not equal with !=', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status != @status');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '!=', searchValue: '@status' }
            ]);
        });

        it('should parse not equal with <>', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status <> @status');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '<>', searchValue: '@status' }
            ]);
        });

        it('should parse column qualified with table name', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE users.id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'users.id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should parse column qualified with table alias', () => {
            const parser = new WhereParser('SELECT * FROM users u WHERE u.id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'u.id', condition: '=', searchValue: '@id' }
            ]);
        });
    });

    describe('ParseConditions - Comparison Operators', () => {
        it('should parse less than operator', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age < @age');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '<', searchValue: '@age' }
            ]);
        });

        it('should parse greater than operator', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age > @age');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '>', searchValue: '@age' }
            ]);
        });

        it('should parse less than or equal operator', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age <= @age');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '<=', searchValue: '@age' }
            ]);
        });

        it('should parse greater than or equal operator', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age >= @age');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '>=', searchValue: '@age' }
            ]);
        });
    });

    describe('ParseConditions - LIKE Operator', () => {
        it('should parse LIKE operator', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE name LIKE @pattern');
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: 'LIKE', searchValue: '@pattern' }
            ]);
        });

        it('should parse LIKE with wildcard pattern', () => {
            const parser = new WhereParser("SELECT * FROM users WHERE name LIKE '%john%'");
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: 'LIKE', searchValue: "'%john%'" }
            ]);
        });

        it('should parse case-insensitive LIKE', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE name like @pattern');
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: 'like', searchValue: '@pattern' }
            ]);
        });
    });

    describe('ParseConditions - IN Operator', () => {
        it('should parse IN operator with parameters', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE role IN (@role1, @role2, @role3)');
            expect(parser.ParseConditions()).toEqual([
                { value: 'role', condition: 'IN', searchValue: '(@role1, @role2, @role3)' }
            ]);
        });

        it('should parse IN operator with literal values', () => {
            const parser = new WhereParser("SELECT * FROM users WHERE status IN ('active', 'pending')");
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: 'IN', searchValue: "('active', 'pending')" }
            ]);
        });

        it('should parse IN operator with numbers', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE id IN (1, 2, 3)');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: 'IN', searchValue: '(1, 2, 3)' }
            ]);
        });

        it('should parse case-insensitive IN', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE role in (@role1, @role2)');
            expect(parser.ParseConditions()).toEqual([
                { value: 'role', condition: 'in', searchValue: '(@role1, @role2)' }
            ]);
        });
    });

    describe('ParseConditions - NULL Checks', () => {
        it('should parse IS NULL', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE deleted_at IS NULL');
            expect(parser.ParseConditions()).toEqual([
                { value: 'deleted_at', condition: 'IS NULL', searchValue: '' }
            ]);
        });

        it('should parse IS NOT NULL', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE deleted_at IS NOT NULL');
            expect(parser.ParseConditions()).toEqual([
                { value: 'deleted_at', condition: 'IS NOT NULL', searchValue: '' }
            ]);
        });

        it('should parse case-insensitive IS NULL', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE deleted_at is null');
            expect(parser.ParseConditions()).toEqual([
                { value: 'deleted_at', condition: 'is null', searchValue: '' }
            ]);
        });

        it('should parse case-insensitive IS NOT NULL', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE deleted_at is not null');
            expect(parser.ParseConditions()).toEqual([
                { value: 'deleted_at', condition: 'is not null', searchValue: '' }
            ]);
        });
    });

    describe('ParseConditions - Multiple Conditions with AND', () => {
        it('should parse two conditions with AND', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status AND age > @age');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'age', condition: '>', searchValue: '@age' }
            ]);
        });

        it('should parse three conditions with AND', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status AND age > @age AND role = @role');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'age', condition: '>', searchValue: '@age' },
                { value: 'role', condition: '=', searchValue: '@role' }
            ]);
        });

        it('should parse case-insensitive AND', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status and age > @age');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'age', condition: '>', searchValue: '@age' }
            ]);
        });

        it('should parse multiple different operators with AND', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age >= 18 AND status != @status AND created_at < @date');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '>=', searchValue: '18' },
                { value: 'status', condition: '!=', searchValue: '@status' },
                { value: 'created_at', condition: '<', searchValue: '@date' }
            ]);
        });
    });

    describe('ParseConditions - Multiple Conditions with OR', () => {
        it('should parse two conditions with OR', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status OR role = @role');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'role', condition: '=', searchValue: '@role' }
            ]);
        });

        it('should parse three conditions with OR', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE role = @role1 OR role = @role2 OR role = @role3');
            expect(parser.ParseConditions()).toEqual([
                { value: 'role', condition: '=', searchValue: '@role1' },
                { value: 'role', condition: '=', searchValue: '@role2' },
                { value: 'role', condition: '=', searchValue: '@role3' }
            ]);
        });

        it('should parse case-insensitive OR', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status or role = @role');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'role', condition: '=', searchValue: '@role' }
            ]);
        });
    });

    describe('ParseConditions - Mixed AND/OR Conditions', () => {
        it('should parse mixed AND and OR conditions', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status AND age > @age OR role = @role');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'age', condition: '>', searchValue: '@age' },
                { value: 'role', condition: '=', searchValue: '@role' }
            ]);
        });

        it('should parse complex mixed conditions', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status OR age > 18 AND role = @role OR deleted_at IS NULL');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'age', condition: '>', searchValue: '18' },
                { value: 'role', condition: '=', searchValue: '@role' },
                { value: 'deleted_at', condition: 'IS NULL', searchValue: '' }
            ]);
        });
    });

    describe('ParseConditions - WHERE with Other Clauses', () => {
        it('should parse WHERE before GROUP BY', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status GROUP BY role');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' }
            ]);
        });

        it('should parse WHERE before ORDER BY', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status ORDER BY created_at');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' }
            ]);
        });

        it('should parse WHERE before LIMIT', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status LIMIT 10');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' }
            ]);
        });

        it('should parse WHERE with GROUP BY, ORDER BY, and LIMIT', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status GROUP BY role ORDER BY created_at LIMIT 10');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' }
            ]);
        });

        it('should parse WHERE ending with semicolon', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE status = @status;');
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' }
            ]);
        });
    });

    describe('ParseConditions - Different Value Types', () => {
        it('should parse numeric literal value', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age = 25');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '=', searchValue: '25' }
            ]);
        });

        it('should parse string literal value', () => {
            const parser = new WhereParser("SELECT * FROM users WHERE name = 'John Doe'");
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: '=', searchValue: "'John Doe'" }
            ]);
        });

        it('should parse parameter value', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE name = @name');
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: '=', searchValue: '@name' }
            ]);
        });

        it('should parse named parameter with colon', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE name = :name');
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: '=', searchValue: ':name' }
            ]);
        });

        it('should parse question mark parameter', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE name = ?');
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: '=', searchValue: '?' }
            ]);
        });

        it('should parse boolean literal', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE active = true');
            expect(parser.ParseConditions()).toEqual([
                { value: 'active', condition: '=', searchValue: 'true' }
            ]);
        });

        it('should parse float value', () => {
            const parser = new WhereParser('SELECT * FROM products WHERE price > 19.99');
            expect(parser.ParseConditions()).toEqual([
                { value: 'price', condition: '>', searchValue: '19.99' }
            ]);
        });

        it('should parse negative number', () => {
            const parser = new WhereParser('SELECT * FROM transactions WHERE amount < -100');
            expect(parser.ParseConditions()).toEqual([
                { value: 'amount', condition: '<', searchValue: '-100' }
            ]);
        });
    });

    describe('ParseConditions - Edge Cases', () => {
        it('should handle extra whitespace', () => {
            const parser = new WhereParser('SELECT   *   FROM   users   WHERE   id   =   @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should handle tabs', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE\tid\t=\t@id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should handle newlines', () => {
            const parser = new WhereParser(`SELECT * FROM users 
                WHERE status = @status 
                AND age > @age`);
            expect(parser.ParseConditions()).toEqual([
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'age', condition: '>', searchValue: '@age' }
            ]);
        });

        it('should handle case-insensitive WHERE', () => {
            const parser = new WhereParser('SELECT * FROM users where id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should handle column names with underscores', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE user_name = @userName');
            expect(parser.ParseConditions()).toEqual([
                { value: 'user_name', condition: '=', searchValue: '@userName' }
            ]);
        });

        it('should handle column names with numbers', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE field1 = @value');
            expect(parser.ParseConditions()).toEqual([
                { value: 'field1', condition: '=', searchValue: '@value' }
            ]);
        });
    });

    describe('ParseConditions - Complex Real-World Scenarios', () => {
        it('should parse user authentication query', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE email = @email AND password = @password AND active = true');
            expect(parser.ParseConditions()).toEqual([
                { value: 'email', condition: '=', searchValue: '@email' },
                { value: 'password', condition: '=', searchValue: '@password' },
                { value: 'active', condition: '=', searchValue: 'true' }
            ]);
        });

        it('should parse age range query', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE age >= @minAge AND age <= @maxAge');
            expect(parser.ParseConditions()).toEqual([
                { value: 'age', condition: '>=', searchValue: '@minAge' },
                { value: 'age', condition: '<=', searchValue: '@maxAge' }
            ]);
        });

        it('should parse search with LIKE and status filter', () => {
            const parser = new WhereParser("SELECT * FROM products WHERE name LIKE @searchTerm AND status = 'active' AND price > @minPrice");
            expect(parser.ParseConditions()).toEqual([
                { value: 'name', condition: 'LIKE', searchValue: '@searchTerm' },
                { value: 'status', condition: '=', searchValue: "'active'" },
                { value: 'price', condition: '>', searchValue: '@minPrice' }
            ]);
        });

        it('should parse multi-role authorization query', () => {
            const parser = new WhereParser('SELECT * FROM users WHERE role IN (@role1, @role2, @role3) AND status = @status AND deleted_at IS NULL');
            expect(parser.ParseConditions()).toEqual([
                { value: 'role', condition: 'IN', searchValue: '(@role1, @role2, @role3)' },
                { value: 'status', condition: '=', searchValue: '@status' },
                { value: 'deleted_at', condition: 'IS NULL', searchValue: '' }
            ]);
        });

        it('should parse soft-delete filter', () => {
            const parser = new WhereParser('SELECT * FROM posts WHERE user_id = @userId AND published = true AND deleted_at IS NULL');
            expect(parser.ParseConditions()).toEqual([
                { value: 'user_id', condition: '=', searchValue: '@userId' },
                { value: 'published', condition: '=', searchValue: 'true' },
                { value: 'deleted_at', condition: 'IS NULL', searchValue: '' }
            ]);
        });

        it('should parse date range with ORDER BY and LIMIT', () => {
            const parser = new WhereParser('SELECT * FROM orders WHERE created_at >= @startDate AND created_at <= @endDate ORDER BY created_at DESC LIMIT 100');
            expect(parser.ParseConditions()).toEqual([
                { value: 'created_at', condition: '>=', searchValue: '@startDate' },
                { value: 'created_at', condition: '<=', searchValue: '@endDate' }
            ]);
        });
    });

    describe('ParseConditions - JOIN Queries', () => {
        it('should parse WHERE with JOIN', () => {
            const parser = new WhereParser('SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = @status');
            expect(parser.ParseConditions()).toEqual([
                { value: 'u.status', condition: '=', searchValue: '@status' }
            ]);
        });

        it('should parse WHERE with multiple table references', () => {
            const parser = new WhereParser('SELECT * FROM users u, orders o WHERE u.id = o.user_id AND u.status = @status');
            expect(parser.ParseConditions()).toEqual([
                { value: 'u.id', condition: '=', searchValue: 'o.user_id' },
                { value: 'u.status', condition: '=', searchValue: '@status' }
            ]);
        });

        it('should parse WHERE with schema-qualified columns', () => {
            const parser = new WhereParser('SELECT * FROM main.users WHERE main.users.id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'main.users.id', condition: '=', searchValue: '@id' }
            ]);
        });
    });

    describe('ParseConditions - UPDATE and DELETE Queries', () => {
        it('should parse WHERE in UPDATE statement', () => {
            const parser = new WhereParser('UPDATE users SET name = @name WHERE id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should parse WHERE in DELETE statement', () => {
            const parser = new WhereParser('DELETE FROM users WHERE id = @id');
            expect(parser.ParseConditions()).toEqual([
                { value: 'id', condition: '=', searchValue: '@id' }
            ]);
        });

        it('should parse complex WHERE in UPDATE', () => {
            const parser = new WhereParser('UPDATE users SET status = @status WHERE role = @role AND age > 18');
            expect(parser.ParseConditions()).toEqual([
                { value: 'role', condition: '=', searchValue: '@role' },
                { value: 'age', condition: '>', searchValue: '18' }
            ]);
        });

        it('should parse complex WHERE in DELETE', () => {
            const parser = new WhereParser('DELETE FROM sessions WHERE user_id = @userId AND expired_at < @now');
            expect(parser.ParseConditions()).toEqual([
                { value: 'user_id', condition: '=', searchValue: '@userId' },
                { value: 'expired_at', condition: '<', searchValue: '@now' }
            ]);
        });
    });

    describe('ParseConditions - Error Cases', () => {
        it('should throw error when WHERE clause is missing', () => {
            expect(() => {
                const parser = new WhereParser('SELECT * FROM users');
                parser.ParseConditions();
            }).toThrow('Invalid SQL query: WHERE clause not found.');
        });

        it('should throw error when WHERE clause is empty', () => {
            expect(() => {
                const parser = new WhereParser('SELECT * FROM users WHERE');
                parser.ParseConditions();
            }).toThrow();
        });
    });
});
