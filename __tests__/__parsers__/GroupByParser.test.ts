import { describe, it, expect } from 'vitest';
import GroupByParser from '../../src/helpers/parsers/GroupByParser.js';

describe('GroupByParser', () => {
    describe('Basic GROUP BY Clauses', () => {
        it('should parse single column GROUP BY', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse multiple columns GROUP BY', () => {
            const parser = new GroupByParser('SELECT country, city, COUNT(*) FROM users GROUP BY country, city');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['country', 'city'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse three columns GROUP BY', () => {
            const parser = new GroupByParser('SELECT year, month, day, COUNT(*) FROM events GROUP BY year, month, day');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['year', 'month', 'day'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with table-qualified column', () => {
            const parser = new GroupByParser('SELECT users.role, COUNT(*) FROM users GROUP BY users.role');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['users.role'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with alias-qualified column', () => {
            const parser = new GroupByParser('SELECT u.role, COUNT(*) FROM users u GROUP BY u.role');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['u.role'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with mixed qualified and unqualified columns', () => {
            const parser = new GroupByParser('SELECT u.country, city, COUNT(*) FROM users u GROUP BY u.country, city');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['u.country', 'city'],
                    havingConditions: undefined
                }
            ]);
        });
    });

    describe('GROUP BY with HAVING Clause', () => {
        it('should parse GROUP BY with HAVING equality condition', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) = 10');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '=',
                        searchValue: '10'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING greater than', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING less than', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) < 100');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '<',
                        searchValue: '100'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING greater than or equal', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) >= 10');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>=',
                        searchValue: '10'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING less than or equal', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) <= 50');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '<=',
                        searchValue: '50'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING not equal !=', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) != 0');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '!=',
                        searchValue: '0'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING not equal <>', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) <> 0');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '<>',
                        searchValue: '0'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING on aggregate function SUM', () => {
            const parser = new GroupByParser('SELECT user_id, SUM(amount) FROM orders GROUP BY user_id HAVING SUM(amount) > 1000');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['user_id'],
                    havingConditions: {
                        value: 'SUM(amount)',
                        condition: '>',
                        searchValue: '1000'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING on aggregate function AVG', () => {
            const parser = new GroupByParser('SELECT category, AVG(price) FROM products GROUP BY category HAVING AVG(price) >= 50.00');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['category'],
                    havingConditions: {
                        value: 'AVG(price)',
                        condition: '>=',
                        searchValue: '50.00'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING on aggregate function MAX', () => {
            const parser = new GroupByParser('SELECT department, MAX(salary) FROM employees GROUP BY department HAVING MAX(salary) > 100000');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['department'],
                    havingConditions: {
                        value: 'MAX(salary)',
                        condition: '>',
                        searchValue: '100000'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING on aggregate function MIN', () => {
            const parser = new GroupByParser('SELECT product_id, MIN(price) FROM orders GROUP BY product_id HAVING MIN(price) < 10');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['product_id'],
                    havingConditions: {
                        value: 'MIN(price)',
                        condition: '<',
                        searchValue: '10'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING on column name', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING status = \'active\'');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'status',
                        condition: '=',
                        searchValue: '\'active\''
                    }
                }
            ]);
        });

        it('should parse GROUP BY with HAVING on qualified column', () => {
            const parser = new GroupByParser('SELECT u.role, COUNT(*) FROM users u GROUP BY u.role HAVING u.role = \'admin\'');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['u.role'],
                    havingConditions: {
                        value: 'u.role',
                        condition: '=',
                        searchValue: '\'admin\''
                    }
                }
            ]);
        });
    });

    describe('GROUP BY with ORDER BY Clause', () => {
        it('should parse GROUP BY followed by ORDER BY', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status ORDER BY COUNT(*) DESC');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with HAVING followed by ORDER BY', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5 ORDER BY status ASC');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with multiple ORDER BY columns', () => {
            const parser = new GroupByParser('SELECT country, city, COUNT(*) FROM users GROUP BY country, city ORDER BY country, city');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['country', 'city'],
                    havingConditions: undefined
                }
            ]);
        });
    });

    describe('GROUP BY with LIMIT Clause', () => {
        it('should parse GROUP BY followed by LIMIT', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status LIMIT 10');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with HAVING followed by LIMIT', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5 LIMIT 20');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with ORDER BY and LIMIT', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status ORDER BY COUNT(*) DESC LIMIT 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with HAVING, ORDER BY, and LIMIT', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 10 ORDER BY COUNT(*) DESC LIMIT 3');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '10'
                    }
                }
            ]);
        });
    });

    describe('GROUP BY with WHERE Clause', () => {
        it('should parse WHERE followed by GROUP BY', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users WHERE active = true GROUP BY status');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse WHERE, GROUP BY, and HAVING', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users WHERE active = true GROUP BY status HAVING COUNT(*) > 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should parse complex query with all clauses', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users WHERE active = true GROUP BY status HAVING COUNT(*) > 5 ORDER BY COUNT(*) DESC LIMIT 10');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });
    });

    describe('GROUP BY with JOINs', () => {
        it('should parse GROUP BY in JOIN query', () => {
            const parser = new GroupByParser('SELECT u.country, COUNT(*) FROM users u INNER JOIN orders o ON u.id = o.user_id GROUP BY u.country');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['u.country'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with HAVING in JOIN query', () => {
            const parser = new GroupByParser('SELECT u.country, COUNT(*) FROM users u INNER JOIN orders o ON u.id = o.user_id GROUP BY u.country HAVING COUNT(*) > 100');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['u.country'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '100'
                    }
                }
            ]);
        });

        it('should parse GROUP BY with multiple JOINs', () => {
            const parser = new GroupByParser('SELECT p.category, COUNT(*) FROM products p INNER JOIN order_items oi ON p.id = oi.product_id INNER JOIN orders o ON oi.order_id = o.id GROUP BY p.category');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['p.category'],
                    havingConditions: undefined
                }
            ]);
        });
    });

    describe('Real-World Complex Scenarios', () => {
        it('should parse sales report by region', () => {
            const parser = new GroupByParser('SELECT region, SUM(total) FROM sales GROUP BY region HAVING SUM(total) > 50000');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['region'],
                    havingConditions: {
                        value: 'SUM(total)',
                        condition: '>',
                        searchValue: '50000'
                    }
                }
            ]);
        });

        it('should parse user activity aggregation', () => {
            const parser = new GroupByParser('SELECT user_id, DATE(created_at), COUNT(*) FROM events GROUP BY user_id, DATE(created_at) HAVING COUNT(*) >= 10');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['user_id', 'DATE(created_at)'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>=',
                        searchValue: '10'
                    }
                }
            ]);
        });

        it('should parse product category statistics', () => {
            const parser = new GroupByParser('SELECT category, AVG(price), COUNT(*) FROM products GROUP BY category HAVING AVG(price) > 25.00 ORDER BY AVG(price) DESC');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['category'],
                    havingConditions: {
                        value: 'AVG(price)',
                        condition: '>',
                        searchValue: '25.00'
                    }
                }
            ]);
        });

        it('should parse customer order summary', () => {
            const parser = new GroupByParser('SELECT customer_id, COUNT(DISTINCT order_id), SUM(total) FROM orders WHERE status = \'completed\' GROUP BY customer_id HAVING COUNT(DISTINCT order_id) > 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['customer_id'],
                    havingConditions: {
                        value: 'COUNT(DISTINCT order_id)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should parse employee department statistics', () => {
            const parser = new GroupByParser('SELECT department, COUNT(*), AVG(salary) FROM employees GROUP BY department HAVING COUNT(*) >= 3 ORDER BY AVG(salary) DESC LIMIT 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['department'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>=',
                        searchValue: '3'
                    }
                }
            ]);
        });

        it('should parse time-based aggregation', () => {
            const parser = new GroupByParser('SELECT YEAR(created_at), MONTH(created_at), COUNT(*) FROM posts GROUP BY YEAR(created_at), MONTH(created_at) HAVING COUNT(*) > 50');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['YEAR(created_at)', 'MONTH(created_at)'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '50'
                    }
                }
            ]);
        });
    });

    describe('Case Sensitivity', () => {
        it('should parse case-insensitive GROUP BY', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users group by status');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse case-insensitive HAVING', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status having COUNT(*) > 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should parse mixed case GROUP BY and HAVING', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users Group By status Having COUNT(*) > 5');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });
    });

    describe('Edge Cases', () => {
        it('should return empty array when GROUP BY is missing', () => {
            const parser = new GroupByParser('SELECT * FROM users WHERE status = \'active\'');
            expect(parser.GroupByValues).toEqual([]);
        });

        it('should handle extra whitespace', () => {
            const parser = new GroupByParser('SELECT   status,   COUNT(*)   FROM   users   GROUP   BY   status');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should handle newlines in query', () => {
            const parser = new GroupByParser(`SELECT status, COUNT(*)
                FROM users
                GROUP BY status
                HAVING COUNT(*) > 5`);
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: {
                        value: 'COUNT(*)',
                        condition: '>',
                        searchValue: '5'
                    }
                }
            ]);
        });

        it('should handle tabs', () => {
            const parser = new GroupByParser('SELECT\tstatus,\tCOUNT(*)\tFROM\tusers\tGROUP\tBY\tstatus');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with column containing underscore', () => {
            const parser = new GroupByParser('SELECT user_type, COUNT(*) FROM users GROUP BY user_type');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['user_type'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should parse GROUP BY with column containing number', () => {
            const parser = new GroupByParser('SELECT field1, COUNT(*) FROM table1 GROUP BY field1');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['field1'],
                    havingConditions: undefined
                }
            ]);
        });

        it('should handle GROUP BY at end of query', () => {
            const parser = new GroupByParser('SELECT status, COUNT(*) FROM users GROUP BY status');
            expect(parser.GroupByValues).toEqual([
                {
                    columns: ['status'],
                    havingConditions: undefined
                }
            ]);
        });
    });
});
