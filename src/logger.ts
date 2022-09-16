import { FileInfo, Mod } from "./db";

// shim for logging, helps with switching between node and web
const log = (label: string, mod: Mod, file: FileInfo) => {
  console.groupCollapsed(`${label}: ${file.name}`);
  console.info(`Mod:`, mod);
  console.info(`File:`, file);
  console.groupCollapsed(`Mod Files`);
  console.table(mod.json, ["file_id", "name", "version", "category_id"]);
  console.groupEnd();
  console.groupEnd();
};
log.group = (message: string, ...args: any[]) => {
  console.groupCollapsed(`%c${message}`, "cursor: pointer; color: #b0bec5ff;", ...args);
};
log.info = (message: string, ...args: any[]) => {
  console.log(`%c${message}`, "font-style: italic;", ...args);
};
log.warn = (message: string, ...args: any[]) => {
  console.warn(`%c${message}`, "", ...args);
};
log.error = (message: string, ...args: any[]) => {
  console.error(`%c${message}`, "", ...args);
};
log.table = (obj: any, cols: string[]) => {
  console.table(obj, cols);
};
log.groupEnd = console.groupEnd;
log.clear = console.clear;

export default log;
