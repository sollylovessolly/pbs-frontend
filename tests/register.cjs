const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const original = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return original.call(
    this,
    name.startsWith("@/")
      ? path.join(process.cwd(), "src", name.slice(2))
      : name,
    ...args,
  );
};
require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
};
