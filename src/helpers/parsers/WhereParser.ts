import { OperatorTypes, WhereValues } from "types/index";
import { BaseParser } from "./BaseParser";
import { SqlUtils } from "./SqlUtils";

/**
 * Parser for SQL WHERE clause conditions.
 * 
 * CURRENT FEATURES:
 * ✅ AND/OR logical operators
 * ✅ Comparison operators (=, !=, <>, <, <=, >, >=)
 * ✅ LIKE/NOT LIKE pattern matching
 * ✅ IN/NOT IN list matching
 * ✅ IS NULL/IS NOT NULL null checks
 * ✅ Parentheses for grouping conditions
 * 
 * TODO FEATURES:
 * - NOT operator
 * - BETWEEN/NOT BETWEEN range conditions
 * - EXISTS/NOT EXISTS subquery conditions
 * - Complex expression parsing
 * - Regular expressions (REGEXP)
 * - GLOB pattern matching
 */

export default class WhereParser extends BaseParser<WhereValues[]> {
    public get WhereValues(): WhereValues[] | undefined {
        return this.Values;
    }

    protected parse(): WhereValues[] {
        const clause = this.extractClause(
            new RegExp(`where\\s+(.*?)${SqlUtils.createTerminatorPattern()}`, 'i'),
            "Invalid SQL query: WHERE clause not found."
        );
        
        if (!clause) return [];

        return SqlUtils.splitByLogicalOperators(clause.content).map(condition => {
            const match = condition.match(new RegExp(
                `(.*?)\\s*(${SqlUtils.createOperatorPattern()})\\s*(.*)`, 'i'
            ));

            if (match) {
                return {
                    value: match[1].trim(),
                    condition: match[2].trim().toUpperCase() as OperatorTypes,
                    searchValue: match[3].trim()
                };
            } else {
                throw new Error(`Invalid condition in WHERE clause: ${condition}`);
            }
        });
    }
}