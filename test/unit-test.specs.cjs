/**
 * To generate tests for ESM:
 * $> npm run genpack:build:test
 */
const {expect} = require("chai");

/** to-esm-esm: remove **/
// Put here, what you want to execute in cjs
// const {...} = require("../cjs/index.cjs");
/** to-esm-esm: end-remove **/

/** to-esm-esm: add
// Add here, what you want to execute in esm
// import {...} from "../esm/index.mjs";
 **/


describe("On cjs/index.cjs", () =>
{
    it("should work", function ()
    {
        const result = true;
        expect(result).to.equal(true);
    });

});