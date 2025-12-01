import { describe } from "node:test";
import { expect, it } from "vitest";
import Parser from "../src/helpers/Parser";

describe("Parser", () => {
    // Tests would go here
    it("Should Parse Complex Nested Queries", () => {
        const sqlQuery = `
            WITH RECURSIVE department_hierarchy AS (
                SELECT 
                    d.id, d.name, d.parent_id, 0 as level
                FROM departments d
                WHERE d.parent_id IS NULL
                UNION ALL
                SELECT 
                    d.id, d.name, d.parent_id, dh.level + 1
                FROM departments d
                JOIN department_hierarchy dh ON d.parent_id = dh.id
            ),
            top_performers AS (
                SELECT 
                    e.id,
                    e.department_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY e.department_id 
                        ORDER BY (
                            SELECT AVG(r.score) 
                            FROM reviews r 
                            WHERE r.employee_id = e.id 
                              AND r.created_at > (
                                  SELECT MAX(p.start_date) 
                                  FROM performance_periods p 
                                  WHERE p.year = EXTRACT(YEAR FROM CURRENT_DATE)
                              )
                        ) DESC
                    ) as performance_rank
                FROM employees e
                WHERE e.status = 'active'
                  AND EXISTS (
                      SELECT 1 
                      FROM projects pr 
                      WHERE pr.team_lead = e.id 
                        AND pr.budget > (
                            SELECT AVG(budget) * 1.5 
                            FROM projects 
                            WHERE status = 'completed' 
                              AND end_date > (
                                  SELECT DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
                              )
                        )
                  )
            )
            SELECT 
                u.id,
                u.username,
                u.email,
                (
                    SELECT JSON_OBJECT(
                        'total_orders', COUNT(*),
                        'total_spent', SUM(o.total),
                        'avg_order_value', AVG(o.total),
                        'last_order_date', MAX(o.created_at),
                        'favorite_categories', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'category', c.name,
                                    'order_count', cat_stats.order_count,
                                    'avg_amount', cat_stats.avg_amount
                                )
                            )
                            FROM (
                                SELECT 
                                    oi.category_id,
                                    COUNT(*) as order_count,
                                    AVG(oi.price * oi.quantity) as avg_amount,
                                    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
                                FROM order_items oi
                                JOIN orders o2 ON oi.order_id = o2.id
                                WHERE o2.user_id = u.id
                                  AND o2.status = 'completed'
                                  AND oi.price > (
                                      SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price)
                                      FROM order_items oi2
                                      JOIN orders o3 ON oi2.order_id = o3.id
                                      WHERE o3.user_id = u.id
                                        AND o3.created_at >= (
                                            SELECT DATE_SUB(u.created_at, INTERVAL 1 YEAR)
                                        )
                                  )
                                GROUP BY oi.category_id
                                HAVING AVG(oi.price * oi.quantity) > (
                                    SELECT AVG(sub_oi.price * sub_oi.quantity) * 1.2
                                    FROM order_items sub_oi
                                    JOIN orders sub_o ON sub_oi.order_id = sub_o.id
                                    WHERE sub_o.user_id = u.id
                                      AND sub_o.created_at >= (
                                          SELECT DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
                                      )
                                )
                            ) cat_stats
                            JOIN categories c ON cat_stats.category_id = c.id
                            WHERE cat_stats.rn <= 5
                        ),
                        'loyalty_score', (
                            SELECT 
                                CASE 
                                    WHEN user_months.months_active >= 24 THEN 'platinum'
                                    WHEN user_months.months_active >= 12 THEN 'gold'
                                    WHEN user_months.months_active >= 6 THEN 'silver'
                                    ELSE 'bronze'
                                END
                            FROM (
                                SELECT COUNT(DISTINCT DATE_FORMAT(o4.created_at, '%Y-%m')) as months_active
                                FROM orders o4
                                WHERE o4.user_id = u.id
                                  AND o4.status = 'completed'
                                  AND o4.created_at >= (
                                      SELECT MIN(registration_date)
                                      FROM user_registrations ur
                                      WHERE ur.user_id = u.id
                                        AND ur.status = 'verified'
                                        AND ur.verification_date IS NOT NULL
                                  )
                            ) user_months
                        )
                    )
                    FROM orders o
                    WHERE o.user_id = u.id
                      AND o.status IN ('completed', 'shipped', 'delivered')
                      AND o.created_at >= (
                          SELECT COALESCE(
                              (SELECT last_analysis_date FROM user_analytics ua WHERE ua.user_id = u.id),
                              u.created_at
                          )
                      )
                ) as user_analytics,
                (
                    SELECT COUNT(DISTINCT f.friend_id)
                    FROM friendships f
                    WHERE f.user_id = u.id
                      AND f.status = 'accepted'
                      AND f.friend_id IN (
                          SELECT u2.id
                          FROM users u2
                          WHERE u2.status = 'active'
                            AND u2.last_login >= (
                                SELECT DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
                            )
                            AND EXISTS (
                                SELECT 1 
                                FROM orders o5 
                                WHERE o5.user_id = u2.id 
                                  AND o5.created_at >= (
                                      SELECT DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
                                  )
                                  AND o5.total >= (
                                      SELECT AVG(o6.total) 
                                      FROM orders o6 
                                      WHERE o6.user_id IN (
                                          SELECT f2.friend_id 
                                          FROM friendships f2 
                                          WHERE f2.user_id = u.id 
                                            AND f2.status = 'accepted'
                                      )
                                        AND o6.status = 'completed'
                                        AND o6.created_at >= (
                                            SELECT DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
                                        )
                                  )
                            )
                      )
                ) as active_high_spending_friends
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN addresses a ON u.id = a.user_id AND a.is_primary = true
            LEFT JOIN cities ct ON a.city_id = ct.id
            LEFT JOIN states st ON ct.state_id = st.id
            WHERE u.status = 'active'
              AND u.created_at >= (
                  SELECT DATE_SUB(CURRENT_DATE, INTERVAL 5 YEAR)
              )
              AND u.id IN (
                  SELECT DISTINCT o7.user_id
                  FROM orders o7
                  WHERE o7.status = 'completed'
                    AND o7.created_at >= (
                        SELECT DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
                    )
                    AND o7.total >= (
                        SELECT PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY total)
                        FROM orders
                        WHERE status = 'completed'
                          AND created_at >= (
                              SELECT DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
                          )
                          AND user_id IN (
                              SELECT ur2.user_id
                              FROM user_registrations ur2
                              WHERE ur2.registration_source IN (
                                  SELECT source_name
                                  FROM marketing_sources ms
                                  WHERE ms.effectiveness_score > (
                                      SELECT AVG(effectiveness_score) * 1.3
                                      FROM marketing_sources
                                      WHERE is_active = true
                                        AND created_at >= (
                                            SELECT DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR)
                                        )
                                  )
                              )
                                AND ur2.verification_date >= (
                                    SELECT DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR)
                                )
                          )
                    )
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM user_blocks ub
                  WHERE ub.user_id = u.id
                    AND ub.is_active = true
                    AND ub.reason IN ('fraud', 'abuse', 'spam')
                    AND ub.created_at >= (
                        SELECT COALESCE(
                            (SELECT MAX(review_date) FROM block_reviews br WHERE br.block_id = ub.id),
                            ub.created_at
                        )
                    )
              )
            ORDER BY (
                SELECT COUNT(*)
                FROM orders o8
                WHERE o8.user_id = u.id
                  AND o8.status = 'completed'
                  AND o8.created_at >= (
                      SELECT DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
                  )
            ) DESC,
            u.created_at ASC
            LIMIT (
                SELECT LEAST(
                    1000,
                    (SELECT COUNT(*) * 0.1 FROM users WHERE status = 'active')
                )
            )
        `;

        const parser = new Parser(sqlQuery);
        const selectValues = parser.SelectValues;
        
        // Verify the parser extracts the main SELECT columns correctly
        expect(selectValues).toBeDefined();
        expect(Array.isArray(selectValues)).toBe(true);
        
        // Extract column names from SelectValues objects
        const selectValuesArray = selectValues as Array<{ columns: string; expressions: string }>;
        const columnNames = selectValuesArray.map(sv => sv.columns);
        expect(columnNames).toContain("u.id");
        expect(columnNames).toContain("u.username");
        expect(columnNames).toContain("u.email");
        // Further detailed assertions can be added based on the expected structure
    });
});