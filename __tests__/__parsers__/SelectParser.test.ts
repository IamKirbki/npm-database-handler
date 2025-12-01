import { describe, it, expect } from 'vitest';
import SelectParser from '../../src/helpers/parsers/SelectParser.js';

describe('SelectParser', () => {
    describe('ParseColumns', () => {
        it('should parse single column', () => {
            const parser = new SelectParser('SELECT name FROM users');
            expect(parser.ParseColumns()).toEqual(['name']);
        });

        it('should parse multiple columns', () => {
            const parser = new SelectParser('SELECT name, email, age FROM users');
            expect(parser.ParseColumns()).toEqual(['name', 'email', 'age']);
        });

        it('should parse asterisk selector', () => {
            const parser = new SelectParser('SELECT * FROM users');
            expect(parser.ParseColumns()).toEqual(['*']);
        });

        it('should parse columns with AS aliases', () => {
            const parser = new SelectParser('SELECT name AS user_name, email AS user_email FROM users');
            expect(parser.ParseColumns()).toEqual(['name', 'email']);
        });

        it('should parse columns with as (lowercase) aliases', () => {
            const parser = new SelectParser('SELECT name as user_name, email as user_email FROM users');
            expect(parser.ParseColumns()).toEqual(['name', 'email']);
        });

        it('should parse table-qualified columns', () => {
            const parser = new SelectParser('SELECT users.name, users.email FROM users');
            expect(parser.ParseColumns()).toEqual(['users.name', 'users.email']);
        });

        it('should parse table-qualified columns with aliases', () => {
            const parser = new SelectParser('SELECT users.name AS user_name, users.email FROM users');
            expect(parser.ParseColumns()).toEqual(['users.name', 'users.email']);
        });

        it('should parse schema-qualified columns', () => {
            const parser = new SelectParser('SELECT main.users.name, main.users.email FROM users');
            expect(parser.ParseColumns()).toEqual(['main.users.name', 'main.users.email']);
        });

        it('should extract columns from arithmetic expressions', () => {
            const parser = new SelectParser('SELECT price * quantity AS total FROM orders');
            expect(parser.ParseColumns()).toEqual(['price', 'quantity']);
        });

        it('should extract columns from complex expressions', () => {
            const parser = new SelectParser('SELECT (price + tax) * quantity AS total FROM orders');
            expect(parser.ParseColumns()).toEqual(['price', 'tax', 'quantity']);
        });

        it('should extract columns from expressions with table qualifiers', () => {
            const parser = new SelectParser('SELECT orders.price * orders.quantity AS total FROM orders');
            expect(parser.ParseColumns()).toEqual(['orders.price', 'orders.quantity']);
        });

        it('should parse mixed regular columns and expressions', () => {
            const parser = new SelectParser('SELECT id, price * quantity AS total, status FROM orders');
            expect(parser.ParseColumns()).toEqual(['id', 'price', 'quantity', 'status']);
        });

        it('should parse columns with aggregate functions', () => {
            const parser = new SelectParser('SELECT COUNT(*) FROM users');
            expect(parser.ParseColumns()).toEqual(['*']);
        });

        it('should parse multiple aggregate functions', () => {
            const parser = new SelectParser('SELECT COUNT(*), MAX(age), MIN(age), AVG(salary) FROM users');
            expect(parser.ParseColumns()).toEqual(['*', 'age', 'age', 'salary']);
        });

        it('should parse aggregate functions with aliases', () => {
            const parser = new SelectParser('SELECT COUNT(*) AS total, AVG(age) AS average_age FROM users');
            expect(parser.ParseColumns()).toEqual(['*', 'age']);
        });

        it('should parse string functions', () => {
            const parser = new SelectParser('SELECT UPPER(name), LOWER(email), LENGTH(description) FROM users');
            expect(parser.ParseColumns()).toEqual(['name', 'email', 'description']);
        });

        it('should parse DISTINCT with single column', () => {
            const parser = new SelectParser('SELECT DISTINCT status FROM users');
            expect(parser.ParseColumns()).toEqual(['status']);
        });

        it('should parse DISTINCT with multiple columns', () => {
            const parser = new SelectParser('SELECT DISTINCT status, role FROM users');
            expect(parser.ParseColumns()).toEqual(['status', 'role']);
        });

        it('should extract columns from CASE statements', () => {
            const parser = new SelectParser('SELECT CASE WHEN age > 18 THEN @adult ELSE @minor END FROM users');
            expect(parser.ParseColumns()).toContain('age');
        });

        it('should extract columns from CASE with alias', () => {
            const parser = new SelectParser('SELECT name, CASE WHEN age > 18 THEN @adult ELSE @minor END AS age_group FROM users');
            expect(parser.ParseColumns()).toContain('name');
            expect(parser.ParseColumns()).toContain('age');
        });

        it('should parse subquery in FROM', () => {
            const parser = new SelectParser('SELECT * FROM (SELECT id, name FROM users WHERE active = @active)');
            expect(parser.ParseColumns()).toEqual(['*']);
        });

        it('should handle extra whitespace', () => {
            const parser = new SelectParser('SELECT   name  ,   email   FROM users');
            expect(parser.ParseColumns()).toEqual(['name', 'email']);
        });

        it('should handle newlines in SELECT clause', () => {
            const parser = new SelectParser(`SELECT 
                name,
                email,
                age
            FROM users`);
            expect(parser.ParseColumns()).toEqual(['name', 'email', 'age']);
        });
    });
});

describe('ParseExpressions', () => {
    it('should return empty array for simple column selection', () => {
        const parser = new SelectParser('SELECT name FROM users');
        expect(parser.ParseExpressions()).toEqual([]);
    });

    it('should return empty array for multiple columns', () => {
        const parser = new SelectParser('SELECT name, email, age FROM users');
        expect(parser.ParseExpressions()).toEqual([]);
    });

    it('should detect arithmetic expressions', () => {
        const parser = new SelectParser('SELECT price * quantity AS total FROM orders');
        expect(parser.ParseExpressions()).toEqual(['price * quantity AS total']);
    });

    it('should detect addition expressions', () => {
        const parser = new SelectParser('SELECT price + tax FROM orders');
        expect(parser.ParseExpressions()).toEqual(['price + tax']);
    });

    it('should detect subtraction expressions', () => {
        const parser = new SelectParser('SELECT revenue - cost FROM orders');
        expect(parser.ParseExpressions()).toEqual(['revenue - cost']);
    });

    it('should detect division expressions', () => {
        const parser = new SelectParser('SELECT total / count FROM orders');
        expect(parser.ParseExpressions()).toEqual(['total / count']);
    });

    it('should detect complex expressions with parentheses', () => {
        const parser = new SelectParser('SELECT (price + tax) * quantity AS total FROM orders');
        expect(parser.ParseExpressions()).toEqual(['(price + tax) * quantity AS total']);
    });

    it('should detect multiple expressions', () => {
        const parser = new SelectParser('SELECT price * quantity AS total, (revenue - cost) AS profit FROM orders');
        expect(parser.ParseExpressions()).toEqual(['price * quantity AS total', '(revenue - cost) AS profit']);
    });

    it('should detect mixed columns and expressions', () => {
        const parser = new SelectParser('SELECT id, price * quantity AS total, status FROM orders');
        expect(parser.ParseExpressions()).toEqual(['price * quantity AS total']);
    });

    it('should detect expressions with table qualifiers', () => {
        const parser = new SelectParser('SELECT orders.price * orders.quantity FROM orders');
        expect(parser.ParseExpressions()).toEqual(['orders.price * orders.quantity']);
    });

    it('should detect function calls as expressions', () => {
        const parser = new SelectParser('SELECT COUNT(*), SUM(price) FROM orders');
        const expressions = parser.ParseExpressions();
        expect(expressions).toContain('COUNT(*)');
        expect(expressions).toContain('SUM(price)');
    });

    it('should detect nested function calls', () => {
        const parser = new SelectParser('SELECT ROUND(AVG(price)) FROM orders');
        expect(parser.ParseExpressions()).toContain('ROUND(AVG(price))');
    });

    it('should detect CASE statements as expressions', () => {
        const parser = new SelectParser('SELECT CASE WHEN age > 18 THEN @adult ELSE @minor END FROM users');
        const expressions = parser.ParseExpressions();
        expect(expressions.length).toBeGreaterThan(0);
        expect(expressions.some(expr => expr.includes('CASE'))).toBe(true);
    });
});

describe('Edge Cases', () => {
    it('should handle case-insensitive SELECT', () => {
        const parser = new SelectParser('select name from users');
        expect(parser.ParseColumns()).toEqual(['name']);
    });

    it('should handle case-insensitive FROM', () => {
        const parser = new SelectParser('SELECT name FROM users');
        expect(parser.ParseColumns()).toEqual(['name']);
    });

    it('should handle mixed case SELECT and FROM', () => {
        const parser = new SelectParser('SeLeCt name FrOm users');
        expect(parser.ParseColumns()).toEqual(['name']);
    });

    it('should handle tabs and multiple spaces', () => {
        const parser = new SelectParser('SELECT\t\tname,\t\temail\t\tFROM\t\tusers');
        expect(parser.ParseColumns()).toEqual(['name', 'email']);
    });

    it('should handle columns with underscores', () => {
        const parser = new SelectParser('SELECT user_name, email_address FROM users');
        expect(parser.ParseColumns()).toEqual(['user_name', 'email_address']);
    });

    it('should handle columns with numbers', () => {
        const parser = new SelectParser('SELECT col1, col2, col3 FROM table1');
        expect(parser.ParseColumns()).toEqual(['col1', 'col2', 'col3']);
    });

    it('should handle expressions with literal numbers', () => {
        const parser = new SelectParser('SELECT price * 1.5 AS discounted FROM products');
        expect(parser.ParseExpressions()).toEqual(['price * 1.5 AS discounted']);
    });

    it('should extract column from expression with literal number', () => {
        const parser = new SelectParser('SELECT price * 1.5 AS discounted FROM products');
        expect(parser.ParseColumns()).toEqual(['price']);
    });
});