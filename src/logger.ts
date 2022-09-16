// shim for console logging, helps with switching between node and web
const log = (message: string, ...args: any[]) => {
  console.log(`%c${message}`, "", ...args);
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
log.groupEnd = console.groupEnd;
log.clear = console.clear;

export default log;
