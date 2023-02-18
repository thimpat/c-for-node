const path = require("path");
const {existsSync} = require("fs");
const {is64Bit} = require("./utils.cjs");

const {execFileSync} = require('child_process');
const {joinPath} = require("@thimpat/libutils");
const {AnaLogger} = require("analogger");

AnaLogger.startLogger();

// Constants
const TCC_NAME_WIN32 = "tcc.exe";
const TCC_NAME_WIN64 = "tcc.exe";
const TCC_DIR = joinPath(__dirname, "../bin/");

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

const getTccPath = function ()
{
    let tccPath;

    // Windows
    if ("win32" === process.platform)
    {
        if (is64Bit())
        {
            tccPath = joinPath(TCC_DIR, TCC_NAME_WIN64);
        }
        else
        {
            tccPath = joinPath(TCC_DIR, TCC_NAME_WIN32);
        }
    }
   else if ("linux" === process.platform)
    {
    }
    else if ("darwin" === process.platform)
    {
    }
    else
    {
        console.error({lid: "NC5201"}, `Unsupported platform [${process.platform}]`)
        return "";
    }


    if (!existsSync(tccPath))
    {
        console.error({lid: "NC5321"}, `TCC not found at ${tccPath}`)
        return "";
    }

    return tccPath;
}

/**
 *
 * @param filepath
 * @param binType
 * @param runType
 * @param output
 * @returns {{success: boolean}}
 */
const processCommand = function (filepath, {
    binType = BIN_TYPE.EXECUTABLE,
    runType = RUN_TYPE.COMPILE,
    output = ""
} = {})
{
    const tccExecutablePath = getTccPath();
    if (!tccExecutablePath)
    {
        return {success: false};
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
        console.log({lid: "NC5002"}, `Compiling [${filepath}]`);
    }

    optionsList.push(filepath);

    if (output)
    {
        optionsList.push("-o");
        optionsList.push(output);
    }

    const result = execFileSync(tccExecutablePath, optionsList);
    const str = result.toString();
    str && console.log({lid: "NC5622"}, str);

    return {success: true, tccExecutablePath};
}

const compileSource = function (filepath, {binType = BIN_TYPE.EXECUTABLE, execPath = "", execArgs = []} = {})
{
    if (!existsSync(filepath))
    {
        console.error({lid: "NC5631"}, `File [${filepath}] not found`);
        process.exit = 1;
        return null;
    }

    if (!execPath)
    {
        const {dir, name} = path.parse(filepath);
        execPath = joinPath(dir, name + ".exe");
    }

    const result = processCommand(filepath, {runType: RUN_TYPE.COMPILE, binType, output: execPath});

    if (!result.success)
    {
        console.error({lid: "NC5629"}, `[${filepath}] Compilation failed`);
        process.exit = 1;
        return null;
    }

    if (!existsSync(execPath))
    {
        console.error({lid: "NC5631"}, `Failed to compiled [${filepath}] to [${execPath}]`);
        process.exit = 1;
        return null;
    }

    return execPath
}

function runBinary(execPath, execArgs)
{
    if (!existsSync(execPath))
    {
        console.error({lid: "NC5323"}, `Could not find ${execPath}`);
        return null;
    }

    console.log({lid: "NC5004"}, `Executing [${execPath}]`);

    const result = execFileSync(execPath, execArgs);
    const str = result.toString();
    str && console.log({lid: "NC5824"}, str);
}

const run = function (filepath, {
    binType = BIN_TYPE.EXECUTABLE,
    runType = RUN_TYPE.JIT,
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
        compileSource(filepath, {binType, execArgs});
        runBinary(execPath, execArgs);
    }
    else if (runType === RUN_TYPE.EXECUTABLE)
    {
        // The executable is already compiled
        runBinary(execPath, execArgs);
    }
}

module.exports.compileSource = compileSource;
module.exports.run = run;

module.exports.RUN_TYPE = RUN_TYPE;
module.exports.BIN_TYPE = BIN_TYPE;
module.exports.ARCH_TYPE = ARCH_TYPE;

