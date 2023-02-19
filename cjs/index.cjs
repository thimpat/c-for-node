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

const PROCESS_ERROR_CODE = {
    SOURCE_UNDEFINED         : 9,
    SOURCE_NOT_FOUND         : 11,
    COMPILED_BINARY_UNDEFINED: 13,
    COMPILED_BINARY_NOT_FOUND: 15
}

/**
 * Run a binary
 * @param execPath
 * @param preCommandMessage
 * @param preCommandSymbol
 * @param preCommandColor
 * @param execArgs
 * @returns {{success: boolean}|{result: Buffer, stdout: string, success: boolean, stderr: string, message: string,
 *     status: (number|number|string|*)}}
 */
const runBinary = function (execPath, {
    execArgs = []
} = {})
{
    if (!execPath)
    {
        console.error({lid: "NC5323"}, `Invalid binary path`);
        return {success: false, status: PROCESS_ERROR_CODE.COMPILED_BINARY_UNDEFINED};
    }

    if (!existsSync(execPath))
    {
        console.error({lid: "NC5325"}, `Could not find ${execPath}`);
        return {success: false, status: PROCESS_ERROR_CODE.COMPILED_BINARY_NOT_FOUND};
    }

    const commandLine = `${execPath} ${execArgs.join(" ")}`;
    let result, stderr, stdout, status, message, success = false;

    try
    {
        result = execFileSync(execPath, execArgs, {stdio: "pipe"});
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

    if (message)
    {
        console.rawLog(message);
    }

    return {success, result, stderr, stdout, status, message, commandLine};
}

/**
 * Run TCC compiler
 * @param execArgs
 * @param preCommandMessage
 * @param preCommandSymbol
 * @param preCommandColor
 * @param showCNodeMessages
 * @returns {{success: boolean, tccExecutablePath: (*|string), status: (number|string|*)}|{success: boolean, status:
 *     number}}
 */
const runTCC = function ({
                             execArgs = [],
                             preCommandMessage = "Executing TCC: ",
                             preCommandSymbol = "coffee",
                             preCommandColor = "rgb(110, 110, 110)",
                             showCNodeMessages = true
                         } = {})
{
    const tccExecutablePath = getTccPath();
    if (!tccExecutablePath)
    {
        return {success: false, status: 2};
    }

    if (showCNodeMessages)
    {
        const commandLine = `${tccExecutablePath} ${execArgs.join(" ")}`;
        console.log({
            lid   : "NC5618",
            color : preCommandColor,
            symbol: "coffee"
        }, `${preCommandMessage}${commandLine}`);
    }

    const {success, message, status} = runBinary(tccExecutablePath, {
        execArgs,
        preCommandMessage,
        preCommandSymbol,
        preCommandColor
    });

    return {success, tccExecutablePath, status, message};

}

/**
 * Create command line to run with the TCC compiler
 * @param sourcePath
 * @param binType
 * @param runType
 * @param tccOptions
 * @param defs
 * @param output
 * @param preCommandMessage
 * @param preCommandSymbol
 * @param preCommandColor
 * @returns {{success: boolean}}
 */
const runTccCommand = function (sourcePath, {
    binType = BIN_TYPE.EXECUTABLE,
    runType = RUN_TYPE.COMPILE,
    tccOptions = [],
    defs = [],
    output = "",
    preCommandMessage = "",
    preCommandSymbol = "coffee",
    preCommandColor = "#656565"
} = {})
{
    try
    {
        const optionsList = [];

        if (binType === BIN_TYPE.SHARED)
        {
            preCommandMessage = `Generating shared library: `;
            optionsList.push("-shared");
        }

        if (runType === RUN_TYPE.JIT)
        {
            optionsList.push("-run");
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

        if (tccOptions && tccOptions.length)
        {
            optionsList.push(...tccOptions);
        }

        const {success, tccExecutablePath, status, message} = runTCC({
            execArgs: optionsList,
            preCommandMessage,
            preCommandColor,
            preCommandSymbol
        });
        message && console.log({lid: "NC5622"}, message);

        return {success, tccExecutablePath, status, message};
    }
    catch (e)
    {
        console.error({lid: "NC5321"}, e.message);
    }

    return {success: false, status: 3};
}

/**
 * Compile source code
 * @param filePath
 * @param binType
 * @param output
 * @param outputDir
 * @param {string[]} defs
 * @param execArgs
 * @param force
 * @returns {string|null}
 */
const compileSource = function (filePath, {
    binType = BIN_TYPE.EXECUTABLE,
    output = "",
    outputDir = "",
    defs = [],
    tccOptions = [],
    force = false
} = {})
{
    let {success: successInfo, execPath: compiledPath, message, status: statusInfo} = getInfo(filePath, {
        output,
        outputDir,
        binType
    });

    if (!successInfo)
    {
        console.error({lid: "NC5639"}, message);
        process.exitCode = statusInfo;
        return null;
    }

    if (!compiledPath)
    {
        console.error({lid: "NC5641"}, `File [${compiledPath}] not found`);
        process.exitCode = PROCESS_ERROR_CODE.COMPILED_BINARY_UNDEFINED;
        return null;
    }

    let preCommandMessage = "Executing TCC: ";
    if (!force && compiledPath && existsSync(compiledPath))
    {
        console.log({
            lid   : "NC5430",
            symbol: "hand",
            color : "#b0724f"
        }, `Skipping compilation: Binary detected at [${compiledPath}]`);
        return compiledPath;
    }

    if (binType === BIN_TYPE.SHARED)
    {
        preCommandMessage = "Generating shared library: "
    }

    const {success, status} = runTccCommand(filePath, {
        runType         : RUN_TYPE.COMPILE,
        binType,
        output          : compiledPath,
        defs,
        preCommandMessage,
        preCommandSymbol: "coffee",
        preCommandColor : "#656565",
        tccOptions
    });

    if (!success)
    {
        process.exitCode = status;
        return null;
    }

    if (!existsSync(compiledPath))
    {
        console.error({lid: "NC5629"}, `Failed to compile [${filePath}] to [${compiledPath}]`);
        process.exitCode = PROCESS_ERROR_CODE.COMPILED_BINARY_NOT_FOUND;
        return null;
    }

    console.log({
        lid   : "NC5432",
        symbol: "black_medium_small_square",
        color : "#336769"
    }, `Binary generated at [${compiledPath}]`);

    return compiledPath;
}

const compileLibrary = function (filePath, {outputDir = ""} = {})
{
    return compileSource(filePath, {binType: BIN_TYPE.SHARED, outputDir})
}

const registerCall = function ()
{

}

/**
 * Returns info source related:
 * execPath: Binary output path
 * @param filePath
 * @param output
 * @param outputDir
 * @returns {{success: boolean}|{execPath: string, filepath, success: boolean}}
 */
const getInfo = function (filePath, {output = "", outputDir = "", binType = BIN_TYPE.EXECUTABLE,} = {})
{
    if (!filePath)
    {
        return {success: false, message: "Invalid path", status: PROCESS_ERROR_CODE.SOURCE_UNDEFINED};
    }

    if (!existsSync(filePath))
    {
        return {success: false, message: `Could not find [${filePath}]`, status: PROCESS_ERROR_CODE.SOURCE_NOT_FOUND};
    }

    let execPath = output;
    if (!execPath)
    {
        const {dir, name} = path.parse(filePath);
        outputDir = outputDir || dir;
        if (binType === BIN_TYPE.EXECUTABLE)
        {
            execPath = joinPath(outputDir, name + ".exe");
        }
        else if (binType === BIN_TYPE.SHARED)
        {
            execPath = joinPath(outputDir, name + ".dll");
        }
    }

    return {filepath: filePath, execPath, success: true}
}

/**
 * Compile then run the generated executable
 * @param filePath
 * @param execArgs
 * @param defs
 * @param output
 * @param outputDir
 * @returns {*}
 */
const runFile = function (filePath, {execArgs = [], defs = [], output = "", outputDir = ""} = {})
{
    let compiledPath = compileSource(filePath, {binType: BIN_TYPE.EXECUTABLE, output, outputDir, defs, execArgs});
    if (!existsSync(compiledPath))
    {
        // Compile source
        if (!compiledPath)
        {
            return {success: false};
        }
    }

    const preCommandMessage = "Executing command: ";
    const commandLine = `${compiledPath} ${execArgs.join(" ")}`;
    console.log({
        lid   : "NC6548",
        color : "#656986",
        symbol: "sparkles"
    }, `${preCommandMessage}${commandLine}`);

    const {success, result, stderr, stdout, status, message} = runBinary(compiledPath, {
        execArgs,
        preCommandMessage,
    });

    return {success, result, stderr, stdout, status, message, commandLine};
}

/**
 * Run the source in memory
 * @param filePath
 * @returns {*}
 */
const runLive = function (filePath, {execArgs = []} = {})
{
    let {success} = getInfo(filePath);
    if (!success)
    {
        console.error({lid: "NC5651"}, `Could not find [${filePath}]`);
        process.exitCode = PROCESS_ERROR_CODE.SOURCE_NOT_FOUND;
        return null;
    }

    let preCommandMessage = "Executing (JIT): ";
    let preCommandSymbol = "sparkles";
    let preCommandColor = "#b79541";

    // Execute source without compiling
    return runTccCommand(filePath, {
        execArgs,
        runType: RUN_TYPE.JIT,
        preCommandMessage,
        preCommandSymbol,
        preCommandColor
    });
}

module.exports = {
    compileSource,
    registerCall,
    runFile,
    runLive,
    runBinary,
    RUN_TYPE,
    BIN_TYPE,
    ARCH_TYPE,
    PROCESS_ERROR_CODE
}

module.exports.compileSource = compileSource;
module.exports.compileLibrary = compileLibrary;
module.exports.registerCall = registerCall;

module.exports.runTCC = runTCC;
module.exports.runFile = runFile;
module.exports.runLive = runLive;
module.exports.runBinary = runBinary;

module.exports.RUN_TYPE = RUN_TYPE;
module.exports.BIN_TYPE = BIN_TYPE;
module.exports.ARCH_TYPE = ARCH_TYPE;
module.exports.PROCESS_ERROR_CODE = PROCESS_ERROR_CODE;

