const {readFileSync} = require("fs");

const {joinPath} = require("@thimpat/libutils");

const {transformTemplate, transformTemplateString} = require("transform-template");

const TPL_DIR = joinPath(__dirname, `../tpl/`);

const loadTemplate = function (templateName, data = {})
{
    const tplPath = joinPath(TPL_DIR, templateName);
    if (!tplPath)
    {
        console.log({lid: "6525"}, `Could not find template for [${templateName}] at [${tplPath}]`);
        return null;
    }

    const content = readFileSync(tplPath, {encoding: "utf8"});
    const modified = transformTemplateString(content, data);

    return modified;
};

module.exports.loadTemplate = loadTemplate;