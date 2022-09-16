import fetch from "./GM_fetch";
import { IModFiles } from "@nexusmods/nexus-api/lib/types";
import { ModBox } from "./@types/lexy";
import DB, { FileInfo, Mod } from "./db";
import coerce from "semver/functions/coerce";

const db = new DB();

//export const modFilters: string[] = [""];
export const modFilters: string[] = [];

// Map of mods that have typos
const ModTypoFixes = new Map([
  // ["Nexus File Name", "Lexy File Name"],
  // Extra space on nexus side
  ["Voices EN  - Part 2", "Voices EN - Part 2"],
  // Extra s at the end on lexy side
  ["NO STARS Texture Overhaul Sky Collection Stars of Nirn (Mid Fantasy) No Stars By CKW25", "NO STARS Texture Overhaul Sky Collection Stars of Nirn (Mid Fantasy) No Stars By CKW25s"],
]);

const versionRegex = /v?(\d+(\.(\d|[ab])+)+)/;

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
  const json = (await filesRaw.json()) as IModFiles;
  return json.files;
};

const NexusMod_Handler = async (mod: Mod, ModVersion?: string) =>
  mod.files.map((NexusFileData) => {
    if (NexusFileData?.id) return NexusFileData;
    const fileData: FileInfo = {
      ...NexusFileData,
    };
    // If it doesn't have a version, make a note and add it if we can
    if (NexusFileData.version && ModVersion) {
      fileData.version = ModVersion;
    }
    // If there's no version still, something is horribly wrong
    if (!fileData.version) {
      console.groupCollapsed(`No version: ${fileData.name}`);
      console.log(`Mod:`, mod);
      console.log(`File:`, fileData);
      console.groupEnd();
      throw new Error(`No version found for ${fileData.name}`);
    }

    const data = NexusMod_Parse(mod, fileData);

    fileData.id = data.file_id;

    return fileData;
  });

const NexusMod_Parse = (mod: Mod, file: FileInfo) => {
  // Look for a matching version
  const versionMatches = mod.json.filter((modFile) => modFile.version == file.version);
  if (versionMatches.length == 1) return versionMatches[0];
  else if (versionMatches.length > 1) {
    // If there's more than 1, try filtering by name.
    for (const match of versionMatches) if (match.name == file.name) return match;
    // Add the version to the name. Fixes "Riften Docks Overhaul"
    for (const match of versionMatches) if (match.name == `${file.name} ${file.version}`) return match;
  }

  // Look for a matching name
  const nameMatches = mod.json.filter((modFile) => modFile.name == file.name);
  if (nameMatches.length == 1) return nameMatches[0];
  else if (nameMatches.length > 1) {
    // If there's more than 1, try filtering by version.
    for (const match of nameMatches) if (match.version == file.version) return match;
  }

  // Look for a matching semver
  const semverMatches = mod.json.filter((match) => coerce(match.version)?.raw === coerce(file.version)?.raw);
  if (semverMatches.length == 1) return semverMatches[0];
  else if (semverMatches.length > 1) {
    // If there's more than 1, try filtering by name.
    for (const match of semverMatches) if (match.name == file.name) return match;
  }

  // Test for files wrongly formatted with the version in the name
  if (versionRegex.test(file.name)) {
    const fileVersion = versionRegex.exec(file.name) as RegExpExecArray;
    const versionMatches = mod.json.filter((modFile) => modFile.version.match(fileVersion[1]));
    // remove the version from the name
    const fileName = file.name.replace(versionRegex, "").trim();
    const nameMatches = versionMatches.filter((modFile) => modFile.name == fileName);
    if (nameMatches.length == 1) return nameMatches[0];
  }

  // Typo fixes
  const TypoList = mod.json.filter((modFile) => ModTypoFixes.has(modFile.name) && ModTypoFixes.get(modFile.name) == file.name);
  if (TypoList.length == 1) return TypoList[0];

  console.groupCollapsed(`${file.name}`);
  console.log(`Mod:`, mod);
  console.log(`File:`, file);
  console.groupEnd();
  throw new Error(`No matches found for ${file.name}`);
};
