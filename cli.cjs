#!/usr/bin/env node
const {runTCC} = require("./cjs/index.cjs");

const init = async function (argv)
{
    const args = argv.slice(2);
    runTCC({execArgs: args, showCNodeMessages: false})
};

(async function ()
{
    await init(process.argv);
}());

