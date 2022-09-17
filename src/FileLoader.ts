import { IFileInfo } from "@nexusmods/nexus-api/lib/types";

export const modFilters: string[] = [];
//export const modFilters: string[] = [``];

export const versionRegex = /((\s-\s)?v?(\d+(\.(\d|[ab])+)+))/;

export const removeDeleted = (file: IFileInfo) => file.category_id !== 6;
