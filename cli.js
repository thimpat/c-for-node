#!/usr/bin/env node
const minimist = require("minimist");

const init = async function (argv)
{
    const args = minimist(argv.slice(2));
};

(async function ()
{
    await init(process.argv);
}());

