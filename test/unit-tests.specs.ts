/**
 * Optional test set up: if you want to use TypeScript for your testing.
 * Otherwise, you can delete this file.
 */
import {describe, it} from "mocha";
import {expect} from "chai";

describe("From TypeScript", () =>
{
    it("should work", function ()
    {
        const result = true;
        expect(result).to.equal(true);
    });
});