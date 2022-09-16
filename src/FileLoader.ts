import fetch from "./GM_fetch";
import { IFileInfo, IModFiles } from "@nexusmods/nexus-api/lib/types";
import { ModBox } from "./@types/lexy";
import DB, { FileInfo, Mod } from "./db";
import coerce from "semver/functions/coerce";
import log from "./logger";

const db = new DB();

export const modFilters: string[] = [];
//export const modFilters: string[] = [``];

// Map of mods that have typos / require substitutions
const ModTypoFixes = new Map([
  // ["Nexus File Name", "Lexy File Name"],
  // Extra s at the end on lexy side
  ["NO STARS Texture Overhaul Sky Collection Stars of Nirn (Mid Fantasy) No Stars By CKW25", "NO STARS Texture Overhaul Sky Collection Stars of Nirn (Mid Fantasy) No Stars By CKW25s"],
  // Dash removed in the latest version (nexus side)
  ["Skyland Solitude", "Skyland - Solitude"],
  // Different
  ["Lux Via (main mod)", "LUX - Via"],
]);
// Map of versions that have typos
const VersionTypoFixes = new Map([
  // ["Lexy File Name", "New Version"],
  // Nexus has 3.20 instead of 3.2
  ["Better FaceLight and Conversation Redux", "3.20"],
  // Lexy has 3.20 instead of 3.2
  ["2. Majestic Mountains Darkside", "3.2"],
]);
const versionRegex = /((\s-\s)?v?(\d+(\.(\d|[ab])+)+))/;

const removeDeleted = (file: IFileInfo) => file.category_id !== 6;

export const NexusMod = async (modItem: Mod | ModBox) => {
  let modInfo = await db.mods.get(modItem.mod);
  if (!modInfo || !modInfo.json) {
    // If we don't have the mod or it's json, fetch it
    modInfo = { ...modItem } as Mod;
    const newInfo = await NexusMod_Fetch(modInfo);
    modInfo.json = newInfo;
    await db.mods.put(modInfo);
  }

  // if any file doesn't have an id or a version, then we need to parse the json
  if (!!modInfo.files.filter(({ id, version }) => !id || !version).length) {
    const newFiles = await NexusMod_Handler(modInfo, modItem.version);
    modInfo.files = newFiles;
    await db.mods.put(modInfo);
  }
  return modInfo;
};

const NexusMod_Fetch = async (mod: Mod) => {
  const filesRaw = await fetch(`https://api.nexusmods.com/v1/games/${mod.game}/mods/${mod.mod}/files.json`, {
    headers: { APIKey: sessionStorage.getItem("nexus-api-key") as string },
  });
  if (filesRaw.status !== 200) {
    log.error(`Error fetching files for ${mod.name}`, filesRaw);
    throw new Error(`Error fetching files for ${mod.name} (${mod.mod})`);
  }
  const json = (await filesRaw.json()) as IModFiles;
  return json.files;
};

const NexusMod_Handler = async (mod: Mod, ModVersion?: string) =>
  mod.files.map((NexusFileData) => {
    // If we already have the id, move on
    if (NexusFileData?.id) return NexusFileData;
    const fileData: FileInfo = {
      ...NexusFileData,
    };
    // If it doesn't have a version, add it if we can
    if (!NexusFileData.version && ModVersion) {
      fileData.version = ModVersion;
    }
    // If there's no version still, something is horribly wrong
    if (!fileData.version) {
      log("No version", mod, fileData);
    }
    const { file_id } = NexusMod_Parse(mod, fileData);
    fileData.id = file_id;
    return fileData;
  });

const NexusMod_Parse = (mod: Mod, file: FileInfo) => {
  // Look for a matching version
  const versionMatches = mod.json.filter((modFile) => modFile.version == file.version).filter(removeDeleted);
  if (versionMatches.length == 1) return versionMatches[0];
  else if (versionMatches.length > 1) {
    // If there's more than 1, try filtering by name.
    for (const match of versionMatches) if (match.name.toLowerCase() == file.name.toLowerCase()) return match;
    // Add the version to the name. Fixes "Riften Docks Overhaul"
    for (const match of versionMatches) if (match.name == `${file.name} ${file.version}`) return match;
    // Add the version to the name but with a v this time. Fixes "Farmhouse Chimneys"
    for (const match of versionMatches) if (match.name == `${file.name} v${file.version}`) return match;
  }

  // Look for a matching name
  const nameMatches = mod.json.filter((modFile) => modFile.name.toLowerCase() == file.name.toLowerCase()).filter(removeDeleted);
  if (nameMatches.length == 1) return nameMatches[0];
  else if (nameMatches.length > 1) {
    // If there's more than 1, try filtering by version.
    for (const match of nameMatches) if (match.version == file.version) return match;
    // check if the file's in the version typo list, and if so, test that version instead
    if (VersionTypoFixes.has(file.name)) {
      const fixedVersion = VersionTypoFixes.get(file.name);
      for (const match of nameMatches) if (match.version == fixedVersion) return match;
    }
  }

  // Look for a matching semver
  const semverMatches = mod.json.filter((match) => coerce(match.version)?.raw === coerce(file.version)?.raw).filter(removeDeleted);
  if (semverMatches.length == 1) return semverMatches[0];
  else if (semverMatches.length > 1) {
    // If there's more than 1, try filtering by name.
    for (const match of semverMatches) if (match.name == file.name) return match;
  }

  // Test for files wrongly formatted with the version in the name
  if (versionRegex.test(file.name)) {
    const fileVersion = versionRegex.exec(file.name) as RegExpExecArray;
    const regexMatches = mod.json.filter((modFile) => coerce(modFile.version)?.raw == coerce(fileVersion[3])?.raw).filter(removeDeleted);
    // remove the version from the name
    const fileName = file.name.replace(fileVersion[0], "").trim();
    const nameMatches = regexMatches.filter((modFile) => modFile.name == fileName).filter(removeDeleted);
    if (nameMatches.length == 1) return nameMatches[0];
  }

  // Test for files with double spaces in the nexus file name. This eliminates several manual substitutions
  const DoubleMatches = mod.json.filter((modFile) => modFile.name.replace(/\s\s/g, " ") == file.name).filter(removeDeleted);
  if (DoubleMatches.length == 1) return DoubleMatches[0];
  else if (DoubleMatches.length > 1) {
    // If there's more than 1, try filtering by version.
    for (const match of DoubleMatches) if (match.version == file.version) return match;
  }

  // Typo fixes
  const TypoList = mod.json.filter((modFile) => {
    if (ModTypoFixes.has(modFile.name)) {
      const fixedName = ModTypoFixes.get(modFile.name);
      return fixedName == file.name;
    }
  });
  if (TypoList.length == 1) return TypoList[0];
  else if (TypoList.length > 1) {
    // If there's more than 1, try filtering by version.
    for (const match of TypoList) if (match.version == file.version) return match;
  }
  log("No matches", mod, file);
  throw new Error(`No matches found for ${file.name}`);
};
