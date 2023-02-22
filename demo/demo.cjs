const {mkdirSync} = require("fs");
const {rimrafSync} = require("rimraf");
const {joinPath} = require("@thimpat/libutils");
const {runFile, runLive, compileSource, compileLibrary, runBinary, invokeFunction, loadFunctions, loadBinaryFunctions} = require("@thimpat/c-node");

process.chdir(__dirname);

const showHello = function ()
{
    // Compile then run generated executable
    runFile("examples/ex1.c", {outputDir: "demo-1/"});

    runFile("examples/hello_win.c", {outputDir: "demo-1/"});

    const compiledCode = compileSource("examples/hello_win.c", {outputDir: "demo-1/"});
    if (!compiledCode)
    {
        return ;
    }

    // Run from source (JIT)
    runLive("examples/hello_win.c");

    // Run generated executable
    runBinary("demo-1/hello_win.exe", {outputDir: "demo-1/"});
}

const generateDll = function ()
{
    const {success, compiledPath} = compileLibrary("examples/dll.c", {outputDir: "demo-1/"});
    // run generated executable
    if (!success)
    {
        console.error(`Compilation error`);
        return ;
    }

    runFile("examples/hello_dll.c", {outputDir: "demo-1/", defs: [compiledPath]});

}

const callFunction = function ()
{
    const result = invokeFunction("hello_func()", "examples/dll.c", {cwd: "demo-2"});
    console.log({lid: 3002}, result);
}

const loadSourceLibrary = function ()
{
    process.chdir(joinPath(__dirname, "./demo-1"));
    const {hello_func} = loadFunctions("../examples/dll.c", {
        hello_func: {
            prototype: "char* hello_func (char*)",
        }
    }, {outputDir: "./"});

    const res = hello_func("My name is awesome");
    console.log({lid: "NC6452"}, res);
}

const loadDll = function ()
{
    process.chdir(joinPath(__dirname, "./resources"));
    const {hello_func} = loadBinaryFunctions("dll.dll", {
        hello_func: {
            prototype: "char* hello_func (char*)",
        }
    });

    const res = hello_func("My name is awesome");
    console.log({lid: "NC6452"}, res);
}

const init = async function (argv)
{
    rimrafSync("demo-1/");
    mkdirSync("demo-1", {recursive: true});

    showHello();
    generateDll();
    callFunction();
    loadSourceLibrary();
    loadDll();
};

(async function ()
{
    await init(process.argv);
}());

