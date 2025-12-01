import { describe } from "node:test";
import { it } from "vitest";
import SelectParser from "../../src/helpers/parsers/SelectParser";

describe("Sample Test Suite", () => {
    it("should run a sample test", () => {
        const query = "SELECT CONCAT(first_name, ' ', last_name) as full_name, COALESCE(email, 'no-email') FROM users";
        const selectParser = new SelectParser(query);
        console.log(selectParser.SelectValues);
    });
});