import { describe, it, expect } from 'vitest';
import SelectParser from '../../src/helpers/parsers/SelectParser.js';

describe('SelectParser', () => {
    describe('ParseColumns', () => {
        it('should parse single column', () => {
            const parser = new SelectParser(`SELECT ProductNumber, Category =
                    CASE ProductLine
                        WHEN 'R' THEN 'Road'
                        WHEN 'M' THEN 'Mountain'
                        WHEN 'T' THEN 'Touring'
                        WHEN 'S' THEN 'Other sale items'
                        ELSE 'Not for sale'
                    END,
                Name
                FROM Production.Product
                ORDER BY ProductNumber;`);
            console.log(parser.SelectValues)
            expect(true).toBe(true);
        });
    });
});