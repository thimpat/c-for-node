const os = require("os");
const {joinPath} = require("@thimpat/libutils");
const {existsSync} = require("fs");

// Constants
const TCC_NAME_WIN32 = "i386-win32-tcc.exe";
const TCC_NAME_WIN64 = "tcc.exe";
const TCC_DIR = joinPath(__dirname, "../bin/");

/**
 * Determine whether the current platform is 64 bit.
 * @see https://futurestud.io/tutorials/node-js-check-if-running-on-64bit-or-32bit-platform
 * @returns {Boolean}
 */
function is64Bit()
{
    return ['arm64', 'ppc64', 'x64', 's390x'].includes(os.arch())
}

/**
 * Returns TCC path based on architecture
 * @returns {*|string}
 */
const getTccPath = function (platform = process.platform)
{
    let tccPath;

    // Windows
    if ("win32" === platform)
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
    else if ("linux" === platform)
    {
        console.error({lid: "NC5201"}, `Unsupported platform [${platform}]`)
        return "";
    }
    else if ("darwin" === platform)
    {
        console.error({lid: "NC5203"}, `Unsupported platform [${platform}]`)
        return "";
    }
    else
    {
        console.error({lid: "NC5205"}, `Unsupported platform [${platform}]`)
        return "";
    }


    if (!existsSync(tccPath))
    {
        console.error({lid: "NC5321"}, `TCC not found at ${tccPath}`)
        return "";
    }

    return tccPath;
}


module.exports.is64Bit = is64Bit;
module.exports.getTccPath = getTccPath;