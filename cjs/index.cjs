const path = require("path");
const {existsSync, writeFileSync, unlinkSync} = require("fs");
const crypto = require("crypto");

const {execFileSync} = require('child_process');
const {joinPath, resolvePath} = require("@thimpat/libutils");
const {AnaLogger} = require("analogger");

const {getTccPath} = require("./utils.cjs");
const {loadTemplate} = require("./tpl.cjs");


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

const CONSTANTS = {
  prefixTemp: `cnode-temp-`
};

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
    execArgs = [],
    cwd = ""
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
        result = execFileSync(execPath, execArgs, {stdio: "pipe", cwd: cwd || process.cwd()});
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
                             cwd = "",
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
        cwd,
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
    cwd = process.cwd(),
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
            cwd,
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
 * @returns {{fileName, success: boolean, compiledPath?: string}}
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
    let {success: successInfo, execPath: compiledPath, message, status: statusInfo, fileName} = getInfo(filePath, {
        output,
        outputDir,
        binType
    });

    if (!successInfo)
    {
        console.error({lid: "NC5639"}, message);
        process.exitCode = statusInfo;
        return {success: false};
    }

    if (!compiledPath)
    {
        console.error({lid: "NC5641"}, `File [${compiledPath}] not found`);
        process.exitCode = PROCESS_ERROR_CODE.COMPILED_BINARY_UNDEFINED;
        return {success: false};
    }

    let preCommandMessage = "Executing TCC: ";
    if (!force && compiledPath && existsSync(compiledPath))
    {
        console.log({
            lid   : "NC5430",
            symbol: "hand",
            color : "#b0724f"
        }, `Skipping compilation: Binary detected at [${compiledPath}]`);
        return {success: true, compiledPath};
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
        return {success: false};
    }

    if (!existsSync(compiledPath))
    {
        console.error({lid: "NC5629"}, `Failed to compile [${filePath}] to [${compiledPath}]`);
        process.exitCode = PROCESS_ERROR_CODE.COMPILED_BINARY_NOT_FOUND;
        return {success: false};
    }

    console.log({
        lid   : "NC5432",
        symbol: "black_medium_small_square",
        color : "#336769"
    }, `Binary generated at [${compiledPath}]`);

    return {success: true, compiledPath, fileName};
}

/**
 * Compile a C library
 * @param filePath
 * @param outputDir
 * @returns {{fileName, success: boolean, compiledPath?: string}}
 */
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
    let fileName = "";
    if (!execPath)
    {
        const {dir, name} = path.parse(filePath);
        outputDir = outputDir || dir;
        if (binType === BIN_TYPE.EXECUTABLE)
        {
            fileName = name + ".exe";
            execPath = joinPath(outputDir, fileName);
        }
        else if (binType === BIN_TYPE.SHARED)
        {
            fileName = name + ".dll";
            execPath = joinPath(outputDir, fileName);
        }
    }

    return {filePath, fileName, execPath, success: true}
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
    let {success: successCompile, compiledPath} = compileSource(filePath, {binType: BIN_TYPE.EXECUTABLE, output, outputDir, defs, execArgs});
    if (!successCompile)
    {
        return {success: false};
    }

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

    return {success, result, stderr, stdout, status, message, commandLine, compiledPath};
}

/**
 * Run the source in memory
 * @param filePath
 * @param execArgs
 * @returns {*}
 */
const runLive = function (filePath, {execArgs = [], defs = [], outputDir = ""} = {})
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
        defs,
        cwd    : outputDir,
        runType: RUN_TYPE.JIT,
        preCommandMessage,
        preCommandSymbol,
        preCommandColor
    });
}

const runString = function (str, {execArgs = [], defs = [], outputDir = ""} = {})
{
    const fileName = CONSTANTS.prefixTemp + crypto.randomInt(0, 9999999) + ".c";
    const filePath = joinPath(outputDir, fileName);
    writeFileSync(filePath, str, {encoding: "utf-8"});

    // const result = runLive(filePath, {defs, outputDir});
    const {success, result, stderr, stdout, status, message, commandLine, compiledPath} = runFile(filePath, {defs, outputDir});

    existsSync(filePath) && unlinkSync(filePath);
    existsSync(compiledPath) &&unlinkSync(compiledPath);

    return {success, result, stderr, stdout, status, message, commandLine, compiledPath};
}

/**
 * Invoke a function from a shared library file (.dll)
 * @param dll
 * @param outputDir
 * @returns {*|null}
 */
const invokeFunction = function (funcName, dll, {outputDir = "./"} = {})
{
    // Compile the DLL
    const {success: successCompile, compiledPath: generatedSharedLibraryPath} = compileLibrary(dll, {outputDir});
    if (!successCompile)
    {
        return null;
    }

    if (!generatedSharedLibraryPath)
    {
        return null;
    }

    const str = loadTemplate("winmain.c", {shebang: "#!/usr/local/bin/tcc -run", invokation: funcName});
    const {success, result, stderr, stdout, status, message, commandLine, compiledPath} = runString(str, {outputDir, defs: [generatedSharedLibraryPath]});

    message && console.log({lid: "NC6542"}, message);
    return {success, result, stderr, stdout, status, message, commandLine, compiledPath};
}


module.exports = {
    compileSource,
    registerCall,
    runFile,
    runLive,
    runBinary,
    invokeFunction,
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
module.exports.runString = runString;
module.exports.runBinary = runBinary;

module.exports.invokeFunction = invokeFunction;

module.exports.RUN_TYPE = RUN_TYPE;
module.exports.BIN_TYPE = BIN_TYPE;
module.exports.ARCH_TYPE = ARCH_TYPE;
module.exports.PROCESS_ERROR_CODE = PROCESS_ERROR_CODE;

