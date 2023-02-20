/**
 * DO NOT EDIT THIS FILE DIRECTLY.
 * This file is generated following the conversion of 
 * @see [./cjs/tpl.cjs]{@link ./cjs/tpl.cjs}
 * 
 **/
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
import {readFileSync}  from "fs";
import {joinPath}  from "@thimpat/libutils";
import {transformTemplate, transformTemplateString}  from "transform-template";





const TPL_DIR = joinPath(__dirname, `../tpl/`);

export const loadTemplate  = function (templateName, data = {})
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

