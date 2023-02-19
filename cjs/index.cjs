const path = require("path");
const {existsSync} = require("fs");
const {getTccPath} = require("./utils.cjs");

const {execFileSync} = require('child_process');
const {joinPath} = require("@thimpat/libutils");
const {AnaLogger} = require("analogger");

AnaLogger.startLogger();

const ARCH_TYPE = {
    WIN32: "WIN32",
    WIN64: "WIN64",
}

const BIN_TYPE = {
    EXECUTABLE: "EXECUTABLE",               // Generate an exe file
    SHARED    : "SHARED"                    // Generate a dll
}

const RUN_TYPE = {
    COMPILE   : "COMPILE",                     // Compile, don't run
    EXECUTABLE: "EXECUTABLE",               // Run the executable
    JIT       : "JIT",                              // Run from the source
    UNDEFINED : "UNDEFINED"                  // Do not know how to run
}


const runBinary = function (execPath, {execArgs = []} = {})
{
    if (!existsSync(execPath))
    {
        console.error({lid: "NC5323"}, `Could not find ${execPath}`);
        return {success: false};
    }

    const commandLine = `${execPath} ${execArgs.join(" ")}`;
    console.log({lid: "NC5618", color: "#7da975", symbol: "sparkles"}, commandLine);

    let result, stderr, stdout, status, message, success = false;

    try
    {
        result = execFileSync(execPath, execArgs, {windowsHide: true, stdio: "pipe"});
        success = true;
        message = result?.toString();
    }
    catch (error)
    {
        status = error.status;
        stderr = error.stderr?.toString();
        stdout = error.stdout?.toString();
        error.message && console.error({lid: "NC5823"}, error.message);
    }

    message && console.log({lid: "NC5824"}, message);

    return {success, result, stderr, stdout, status, message};
}

/**
 *
 * @param sourcePath
 * @param binType
 * @param runType
 * @param defs
 * @param output
 * @returns {{success: boolean}}
 */
const processCommand = function (sourcePath, {
    binType = BIN_TYPE.EXECUTABLE,
    runType = RUN_TYPE.COMPILE,
    defs = [],
    output = ""
} = {})
{
    try
    {
        const tccExecutablePath = getTccPath();
        if (!tccExecutablePath)
        {
            return {success: false, status: 2};
        }

        const optionsList = [];

        if (binType === BIN_TYPE.SHARED)
        {
            optionsList.push("-shared");
        }

        if (runType === RUN_TYPE.JIT)
        {
            optionsList.push("-run");
        }
        else if (runType === RUN_TYPE.COMPILE)
        {
            console.log({lid: "NC5002", symbol: "coffee"}, `Compiling [${sourcePath}]`);
        }

        optionsList.push(sourcePath);

        if (defs?.length)
        {
            optionsList.push(...defs);
        }

        if (output)
        {
            optionsList.push("-o");
            optionsList.push(output);
        }

        const {success, message, status} = runBinary(tccExecutablePath, {execArgs: optionsList});

        message && console.log({lid: "NC5622"}, message);

        return {success, tccExecutablePath, status};

    }
    catch (e)
    {
        console.error({lid: "NC5321"}, e.message);
    }

    return {success: false, status: 3};
}

/**
 * Compile source code
 * @param filepath
 * @param binType
 * @param execPath
 * @param {string[]} defs
 * @param execArgs
 * @returns {string|null}
 */
const compileSource = function (filepath, {binType = BIN_TYPE.EXECUTABLE, execPath = "", defs = [], execArgs = []} = {})
{
    if (!existsSync(filepath))
    {
        console.error({lid: "NC5631"}, `File [${filepath}] not found`);
        process.exitCode = 1;
        return null;
    }

    if (!execPath)
    {
        const {dir, name} = path.parse(filepath);
        if (binType === BIN_TYPE.EXECUTABLE)
        {
            execPath = joinPath(dir, name + ".exe");
        }
        else if (binType === BIN_TYPE.SHARED)
        {
            execPath = joinPath(dir, name + ".dll");
        }
    }

    const {success, status} = processCommand(filepath, {runType: RUN_TYPE.COMPILE, binType, output: execPath, defs});

    if (!success)
    {
        process.exitCode = status;
        return null;
    }

    if (!existsSync(execPath))
    {
        console.error({lid: "NC5629"}, `Failed to compile [${filepath}] to [${execPath}]`);
        process.exitCode = 1;
        return null;
    }

    return execPath
}

const registerCall = function ()
{

}

/**
 *
 * @param filepath
 * @param binType
 * @param runType
 * @param {string[]} defs
 * @param execPath
 * @param execArgs
 * @returns {null}
 */
const run = function (filepath, {
    binType = BIN_TYPE.EXECUTABLE,
    runType = RUN_TYPE.JIT,
    defs = [],
    execPath = "",
    execArgs = []
} = {})
{
    if (!existsSync(filepath))
    {
        console.error({lid: "NC5641"}, `File [${filepath}] not found`);
        processCommand.exit = 1;
        return null;
    }

    if (!execPath)
    {
        const {dir, name} = path.parse(filepath);
        execPath = joinPath(dir, name + ".exe");
    }

    if (runType === RUN_TYPE.JIT)
    {
        // Execute source without compiling
        processCommand(filepath, {runType: RUN_TYPE.JIT});
    }
    else if (runType === RUN_TYPE.COMPILE)
    {
        // Compile source
        if (compileSource(filepath, {binType, defs, execArgs}))
        {
            runBinary(execPath, {execArgs});
        }
    }
    else if (runType === RUN_TYPE.EXECUTABLE)
    {
        // The executable is already compiled
        runBinary(execPath, {execArgs});
    }
}

module.exports.compileSource = compileSource;
module.exports.registerCall = registerCall;
module.exports.run = run;

module.exports.RUN_TYPE = RUN_TYPE;
module.exports.BIN_TYPE = BIN_TYPE;
module.exports.ARCH_TYPE = ARCH_TYPE;

