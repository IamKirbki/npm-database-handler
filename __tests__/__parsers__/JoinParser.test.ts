import { describe, it, expect } from 'vitest';
import JoinParser from '../../src/helpers/parsers/JoinParser.js';

describe('JoinParser', () => {
    describe('Basic JOIN Types', () => {
        it('should parse INNER JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse LEFT JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse RIGHT JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users RIGHT JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'RIGHT JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse FULL JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users FULL JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'FULL JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse CROSS JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users CROSS JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'CROSS JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse JOIN without type keyword', () => {
            const parser = new JoinParser('SELECT * FROM users JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });
    });

    describe('OUTER JOIN Variations', () => {
        it('should parse LEFT OUTER JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users LEFT OUTER JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT OUTER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse RIGHT OUTER JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users RIGHT OUTER JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'RIGHT OUTER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse FULL OUTER JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users FULL OUTER JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'FULL OUTER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });
    });

    describe('JOINs with Aliases', () => {
        it('should parse JOIN with AS alias', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders AS o ON users.id = o.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: 'o',
                    onCondition: 'users.id = o.user_id'
                }
            ]);
        });

        it('should parse JOIN with alias without AS', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders o ON users.id = o.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: 'o',
                    onCondition: 'users.id = o.user_id'
                }
            ]);
        });

        it('should parse multiple JOINs with aliases', () => {
            const parser = new JoinParser('SELECT * FROM users LEFT JOIN orders AS o ON users.id = o.user_id RIGHT JOIN products AS p ON o.product_id = p.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'orders',
                    alias: 'o',
                    onCondition: 'users.id = o.user_id'
                },
                {
                    joinType: 'RIGHT JOIN',
                    tableName: 'products',
                    alias: 'p',
                    onCondition: 'o.product_id = p.id'
                }
            ]);
        });
    });

    describe('Multiple JOINs', () => {
        it('should parse two JOINs', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id LEFT JOIN products ON orders.product_id = products.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'products',
                    alias: undefined,
                    onCondition: 'orders.product_id = products.id'
                }
            ]);
        });

        it('should parse three JOINs', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id LEFT JOIN products ON orders.product_id = products.id RIGHT JOIN categories ON products.category_id = categories.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'products',
                    alias: undefined,
                    onCondition: 'orders.product_id = products.id'
                },
                {
                    joinType: 'RIGHT JOIN',
                    tableName: 'categories',
                    alias: undefined,
                    onCondition: 'products.category_id = categories.id'
                }
            ]);
        });

        it('should parse multiple JOINs of same type', () => {
            const parser = new JoinParser('SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id LEFT JOIN addresses ON users.id = addresses.user_id LEFT JOIN preferences ON users.id = preferences.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'addresses',
                    alias: undefined,
                    onCondition: 'users.id = addresses.user_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'preferences',
                    alias: undefined,
                    onCondition: 'users.id = preferences.user_id'
                }
            ]);
        });

        it('should parse mixed JOIN types', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id LEFT OUTER JOIN products ON orders.product_id = products.id FULL JOIN categories ON products.category_id = categories.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                },
                {
                    joinType: 'LEFT OUTER JOIN',
                    tableName: 'products',
                    alias: undefined,
                    onCondition: 'orders.product_id = products.id'
                },
                {
                    joinType: 'FULL JOIN',
                    tableName: 'categories',
                    alias: undefined,
                    onCondition: 'products.category_id = categories.id'
                }
            ]);
        });
    });

    describe('Complex ON Conditions', () => {
        it('should parse JOIN with simple equality', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse JOIN with multiple conditions using AND', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id AND users.status = orders.status');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id AND users.status = orders.status'
                }
            ]);
        });

        it('should parse JOIN with multiple conditions using OR', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id OR users.email = orders.email');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id OR users.email = orders.email'
                }
            ]);
        });

        it('should parse JOIN with comparison operators', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id AND orders.total > 100');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id AND orders.total > 100'
                }
            ]);
        });

        it('should parse JOIN with complex mixed conditions', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id AND orders.status = \'active\' OR orders.priority >= 5');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id AND orders.status = \'active\' OR orders.priority >= 5'
                }
            ]);
        });

        it('should parse JOIN with aliased columns in ON', () => {
            const parser = new JoinParser('SELECT * FROM users AS u INNER JOIN orders AS o ON u.id = o.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: 'o',
                    onCondition: 'u.id = o.user_id'
                }
            ]);
        });
    });

    describe('JOINs with WHERE Clause', () => {
        it('should parse JOIN followed by WHERE', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.status = \'active\'');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse multiple JOINs with WHERE', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id LEFT JOIN products ON orders.product_id = products.id WHERE users.active = true');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'products',
                    alias: undefined,
                    onCondition: 'orders.product_id = products.id'
                }
            ]);
        });
    });

    describe('JOINs with Other Clauses', () => {
        it('should parse JOIN with GROUP BY', () => {
            const parser = new JoinParser('SELECT users.name, COUNT(*) FROM users INNER JOIN orders ON users.id = orders.user_id GROUP BY users.name');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse JOIN with ORDER BY', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id ORDER BY orders.created_at DESC');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse JOIN with LIMIT', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id LIMIT 10');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse JOIN with all clauses', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id WHERE users.status = \'active\' GROUP BY users.id HAVING COUNT(*) > 5 ORDER BY users.created_at LIMIT 20');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });
    });

    describe('Self JOINs', () => {
        it('should parse self JOIN with aliases', () => {
            const parser = new JoinParser('SELECT * FROM employees AS e1 INNER JOIN employees AS e2 ON e1.manager_id = e2.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'employees',
                    alias: 'e2',
                    onCondition: 'e1.manager_id = e2.id'
                }
            ]);
        });

        it('should parse multiple self JOINs', () => {
            const parser = new JoinParser('SELECT * FROM users AS u1 LEFT JOIN users AS u2 ON u1.referrer_id = u2.id LEFT JOIN users AS u3 ON u2.referrer_id = u3.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'users',
                    alias: 'u2',
                    onCondition: 'u1.referrer_id = u2.id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'users',
                    alias: 'u3',
                    onCondition: 'u2.referrer_id = u3.id'
                }
            ]);
        });
    });

    describe('JOINs with Table Names Containing Underscores and Numbers', () => {
        it('should parse JOIN with underscore in table name', () => {
            const parser = new JoinParser('SELECT * FROM user_accounts INNER JOIN order_items ON user_accounts.id = order_items.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'order_items',
                    alias: undefined,
                    onCondition: 'user_accounts.id = order_items.user_id'
                }
            ]);
        });

        it('should parse JOIN with numbers in table name', () => {
            const parser = new JoinParser('SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.ref_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'table2',
                    alias: undefined,
                    onCondition: 'table1.id = table2.ref_id'
                }
            ]);
        });

        it('should parse JOIN with mixed underscores and numbers', () => {
            const parser = new JoinParser('SELECT * FROM user_data_2024 INNER JOIN order_log_2024 ON user_data_2024.user_id = order_log_2024.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'order_log_2024',
                    alias: undefined,
                    onCondition: 'user_data_2024.user_id = order_log_2024.user_id'
                }
            ]);
        });
    });

    describe('Case Sensitivity', () => {
        it('should parse case-insensitive INNER JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users inner join orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse case-insensitive LEFT JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users left join orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse mixed case JOIN', () => {
            const parser = new JoinParser('SELECT * FROM users Left Outer Join orders On users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT OUTER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should parse case-insensitive AS keyword', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders as o ON users.id = o.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: 'o',
                    onCondition: 'users.id = o.user_id'
                }
            ]);
        });
    });

    describe('Real-World Complex Scenarios', () => {
        it('should parse e-commerce order query', () => {
            const parser = new JoinParser('SELECT * FROM customers AS c INNER JOIN orders AS o ON c.id = o.customer_id LEFT JOIN order_items AS oi ON o.id = oi.order_id LEFT JOIN products AS p ON oi.product_id = p.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: 'o',
                    onCondition: 'c.id = o.customer_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'order_items',
                    alias: 'oi',
                    onCondition: 'o.id = oi.order_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'products',
                    alias: 'p',
                    onCondition: 'oi.product_id = p.id'
                }
            ]);
        });

        it('should parse user activity tracking query', () => {
            const parser = new JoinParser('SELECT * FROM users AS u LEFT JOIN sessions AS s ON u.id = s.user_id LEFT JOIN events AS e ON s.id = e.session_id LEFT JOIN event_data AS ed ON e.id = ed.event_id WHERE u.active = true');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'sessions',
                    alias: 's',
                    onCondition: 'u.id = s.user_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'events',
                    alias: 'e',
                    onCondition: 's.id = e.session_id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'event_data',
                    alias: 'ed',
                    onCondition: 'e.id = ed.event_id'
                }
            ]);
        });

        it('should parse hierarchical data query', () => {
            const parser = new JoinParser('SELECT * FROM categories AS c1 LEFT JOIN categories AS c2 ON c1.parent_id = c2.id LEFT JOIN categories AS c3 ON c2.parent_id = c3.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'categories',
                    alias: 'c2',
                    onCondition: 'c1.parent_id = c2.id'
                },
                {
                    joinType: 'LEFT JOIN',
                    tableName: 'categories',
                    alias: 'c3',
                    onCondition: 'c2.parent_id = c3.id'
                }
            ]);
        });

        it('should parse many-to-many relationship query', () => {
            const parser = new JoinParser('SELECT * FROM students AS s INNER JOIN student_courses AS sc ON s.id = sc.student_id INNER JOIN courses AS c ON sc.course_id = c.id INNER JOIN instructors AS i ON c.instructor_id = i.id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'student_courses',
                    alias: 'sc',
                    onCondition: 's.id = sc.student_id'
                },
                {
                    joinType: 'INNER JOIN',
                    tableName: 'courses',
                    alias: 'c',
                    onCondition: 'sc.course_id = c.id'
                },
                {
                    joinType: 'INNER JOIN',
                    tableName: 'instructors',
                    alias: 'i',
                    onCondition: 'c.instructor_id = i.id'
                }
            ]);
        });
    });

    describe('Edge Cases', () => {
        it('should return empty array when no JOINs present', () => {
            const parser = new JoinParser('SELECT * FROM users WHERE id = 1');
            expect(parser.JoinValues).toEqual([]);
        });

        it('should handle extra whitespace', () => {
            const parser = new JoinParser('SELECT   *   FROM   users   INNER   JOIN   orders   ON   users.id   =   orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should handle newlines in query', () => {
            const parser = new JoinParser(`SELECT * FROM users
                INNER JOIN orders
                ON users.id = orders.user_id`);
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });

        it('should handle query ending with semicolon', () => {
            const parser = new JoinParser('SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id');
            expect(parser.JoinValues).toEqual([
                {
                    joinType: 'INNER JOIN',
                    tableName: 'orders',
                    alias: undefined,
                    onCondition: 'users.id = orders.user_id'
                }
            ]);
        });
    });
});