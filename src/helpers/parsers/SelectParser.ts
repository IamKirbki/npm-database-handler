import { SelectExpression, SelectValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * SELECT [SOMETHING] FROM ...
 * 
 * Column: * | column_name | table_name.column_name | expression
 * 
 * * works
 * column_name works
 * table_name.column_name should still be dragged apart into {table: table_name, column: column_name}
 * 
 * === SELECT CLAUSE EXPRESSIONS ===
 * 
 * Basic Columns:
 * column_name
 * table_name.column_name
 * schema.table.column_name
 * *
 * table_name.*
 * 
 * Aggregate Functions:
 * COUNT(*)
 * COUNT(column_name)
 * COUNT(DISTINCT column_name)
 * SUM(column_name)
 * AVG(column_name)
 * MIN(column_name)
 * MAX(column_name)
 * GROUP_CONCAT(column_name)
 * TOTAL(column_name)
 * 
 * Mathematical Expressions:
 * column_name + column_name
 * column_name - column_name
 * column_name * column_name
 * column_name / column_name
 * column_name % column_name
 * (column_name + column_name) * 2
 * ABS(column_name)
 * ROUND(column_name, 2)
 * CEIL(column_name)
 * FLOOR(column_name)
 * POWER(column_name, 2)
 * SQRT(column_name)
 * 
 * String Functions:
 * UPPER(column_name)
 * LOWER(column_name)
 * LENGTH(column_name)
 * SUBSTR(column_name, 1, 10)
 * TRIM(column_name)
 * LTRIM(column_name)
 * RTRIM(column_name)
 * REPLACE(column_name, 'old', 'new')
 * CONCAT(first_name, ' ', last_name)
 * first_name || ' ' || last_name
 * INSTR(column_name, 'search')
 * 
 * Date/Time Functions:
 * DATE(column_name)
 * TIME(column_name)
 * DATETIME(column_name)
 * STRFTIME('%Y-%m-%d', column_name)
 * JULIANDAY(column_name)
 * DATE('now')
 * DATETIME('now', 'localtime')
 * DATE(column_name, '+1 day')
 * 
 * Conditional Expressions:
 * CASE WHEN age > 18 THEN 'Adult' ELSE 'Minor' END
 * CASE status WHEN 1 THEN 'Active' WHEN 0 THEN 'Inactive' ELSE 'Unknown' END
 * IIF(score > 80, 'Pass', 'Fail')
 * COALESCE(nickname, first_name, 'Unknown')
 * NULLIF(column_name, 0)
 * IFNULL(column_name, 'N/A')
 * 
 * Type Conversion:
 * CAST(column_name AS INTEGER)
 * CAST(column_name AS REAL)
 * CAST(column_name AS TEXT)
 * TYPEOF(column_name)
 * 
 * Subqueries (Scalar):
 * (SELECT COUNT(*) FROM orders WHERE user_id = users.id)
 * (SELECT MAX(created_at) FROM orders WHERE user_id = users.id)
 * 
 * Window Functions:
 * ROW_NUMBER() OVER (ORDER BY created_at)
 * RANK() OVER (PARTITION BY department ORDER BY salary DESC)
 * DENSE_RANK() OVER (ORDER BY score)
 * LAG(salary, 1) OVER (ORDER BY hire_date)
 * LEAD(salary, 1) OVER (ORDER BY hire_date)
 * SUM(amount) OVER (PARTITION BY user_id ORDER BY date)
 * AVG(score) OVER (ORDER BY date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
 * 
 * JSON Functions (SQLite 3.38+):
 * JSON_EXTRACT(json_column, '$.key')
 * JSON_ARRAY(val1, val2, val3)
 * JSON_OBJECT('name', name, 'age', age)
 * JSON_ARRAY_LENGTH(json_column)
 * JSON_VALID(json_column)
 * 
 * Column Aliases:
 * column_name AS alias_name
 * expression AS alias_name
 * column_name alias_name (without AS)
 */

export default class SelectParser extends BaseParser<SelectValues[]> {
    public get SelectValues(): SelectValues[] | undefined {
        return this._values;
    }

    protected parse(): SelectValues[] {
        const selectContent = this.extractClause(
            /select\s+([\s\S]*?)\s+from/i,
            "Couldn't find select match!"
        )?.content.trim();

        const columnStrings = SqlUtils.splitByComma(selectContent);
        
        return columnStrings.map(columnStr => 
            this.parseColumn(columnStr.trim())
        );
    }

    private parseColumn(columnStr: string): SelectValues {
        const caseMatch = columnStr.match(/case([\s\S]*?)end/i);
        // if(caseMatch?[0]) {
            
        // }

        const aliasMatch = columnStr.match(/\s+(?:as\s+)?(\w+)$/i);
        const alias = aliasMatch?.[1];
        
        if (aliasMatch) {
            columnStr = columnStr.slice(0, aliasMatch.index).trim();
        }

        const functionMatch = columnStr.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
        
        const mathMatch = !functionMatch ? 
            columnStr.match(/(.+?)([+\-*/%])(.+)/) : null;

        let expression: SelectExpression | undefined;

        if (functionMatch) {
            expression = this.parseExpression(functionMatch[1], functionMatch[2]);
        } else if (mathMatch) {
            const operator = mathMatch[2];
            const operands = `${mathMatch[1].trim()},${mathMatch[3].trim()}`;
            expression = this.parseExpression(operator, operands);
        }

        const column = expression 
            ? this.extractColumnNames(expression.columns)
            : columnStr.trim();

        return { column, expression, alias };
    }

    private parseExpression(expression: string, parameters: string): SelectExpression {
        const rule = SqlUtils.expressionRules.find(
            r => r.name.toUpperCase() === expression.toUpperCase()
        );
        const params = SqlUtils.splitByComma(parameters).map(param => param.trim());

        if (rule) {
            this.validateParameterCount(expression, params.length, rule.parameterRange);
        }

        return {
            name: expression,
            columns: params.filter(this.isValidParameter)
        };
    }

    // private parseCaseExpression(caseContent: string): SelectExpression {

    // }

    private extractColumnNames(columns: string[]): string[] {
        return columns.filter(col => 
            !this.isLiteral(col) && !this.isNumeric(col)
        );
    }

    private validateParameterCount(expression: string, count: number, range: [number, number]): void {
        if (count < range[0] || count > range[1]) {
            throw new Error(
                `Invalid number of parameters for expression ${expression}. ` +
                `Expected between ${range[0]} and ${range[1]}, got ${count}.`
            );
        }
    }

    private isValidParameter(param: string): boolean {
        return (
            /^\w+$/.test(param) ||              // Column name
            /^\d+(\.\d+)?$/.test(param) ||      // Number
            /^(['"]).*\1$/.test(param) ||       // String literal
            /^null$/i.test(param) ||            // NULL
            /^(true|false)$/i.test(param)       // Boolean
        );
    }

    private isLiteral(value: string): boolean {
        return /^(['"]).*\1$/.test(value);
    }

    private isNumeric(value: string): boolean {
        return /^\d+(\.\d+)?$/.test(value);
    }
}