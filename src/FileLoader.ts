import { IFileInfo } from "@nexusmods/nexus-api/lib/types";

export const modFilters: string[] = [];
//export const modFilters: string[] = [``];

export const versionRegex = /((\s-\s)?v?(\d+(\.(\d|[ab])+)+))/;

export const removeDeleted = (file: IFileInfo) => file.category_id !== 6;

type FileFilter = (file: IFileInfo) => boolean;
/**
 * Test a list of files against various filters
 *
 * @param {IFileInfo[]} files List of mod files to filter
 * @param {FileFilter} filter Initial filter function
 * @param {...FileFilter[]} extraFilters Additional filter functions to be applied to the results of the initial filter
 * @return {(IFileInfo | undefined)} The first file that passes all filters, or undefined if none pass
 */
export const fileFilter = (files: IFileInfo[], filter: FileFilter, ...extraFilters: FileFilter[]): IFileInfo | undefined => {
  const filtered = files.filter(filter).filter(removeDeleted);
  if (filtered.length === 1) return filtered[0];
  if (filtered.length > 1) {
    extraFilters.forEach((filter) => {
      const secondaryFiltered = filtered.filter(filter);
      if (secondaryFiltered.length === 1) return secondaryFiltered[0];
    });
  }
};
