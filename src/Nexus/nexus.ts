import fetch from "../GM_fetch";
import { IModFiles } from "@nexusmods/nexus-api/lib/types";
import { coerce } from "semver";
import he from "he";
import { ModBox } from "../@types/lexy";
import { skipMods, VersionTypoFixes, ModTypoFixes } from "../config";
import DB, { Mod, FileInfo } from "../db";
import { fileFilter, versionRegex } from "../FileLoader";
import log from "../logger";
const db = new DB();

export const NexusMod = async (modItem: Mod | ModBox) => {
  if (skipMods.includes(modItem.name)) return;
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
  const versionMatch = fileFilter(
    mod.json,
    (modFile) => modFile.version == file.version,
    // If there's more than 1, try filtering by name.
    (match) => match.name.toLowerCase() == file.name.toLowerCase(),
    // Add the version to the name. Fixes "Riften Docks Overhaul"
    (match) => match.name == `${file.name} ${file.version}`,
    // Add the version to the name but with a v this time. Fixes "Farmhouse Chimneys"
    (match) => match.name == `${file.name} v${file.version}`,
    // Decode any html entities in the name
    (match) => he.decode(match.name) == file.name
  );
  if (versionMatch) return versionMatch;

  // Look for a matching name
  const nameMatch = fileFilter(
    mod.json,
    (modFile) => modFile.name.toLowerCase() == file.name.toLowerCase(),
    // If there's more than 1, try filtering by version.
    (match) => match.version == file.version,
    // check if the file's in the version typo list, and if so, test that version instead
    (match) => VersionTypoFixes.has(file.name) && match.version == VersionTypoFixes.get(file.name)
  );
  if (nameMatch) return nameMatch;

  // Look for a matching semver
  const semverMatch = fileFilter(
    mod.json,
    (match) => coerce(match.version)?.raw === coerce(file.version)?.raw,
    // If there's more than 1, try filtering by name.
    (match) => match.name.trim() == file.name.trim()
  );
  if (semverMatch) return semverMatch;

  // Test for files wrongly formatted with the version in the name
  if (versionRegex.test(file.name)) {
    const [verString, , , verValue] = versionRegex.exec(file.name) as RegExpExecArray;
    const fileName = file.name.replace(verString, "").trim();
    const regexMatch = fileFilter(
      mod.json,
      (modFile) => coerce(modFile.version)?.raw == coerce(verValue)?.raw,
      // If there's more than 1, try filtering by name.
      (match) => match.name.trim() == file.name.trim(),
      // Now try with the version stripped
      (match) => match.name.trim() == fileName
    );
    if (regexMatch) return regexMatch;
  }

  // Test for files with double spaces in the nexus file name. This eliminates several manual substitutions
  const doubleSpaceMatch = fileFilter(
    mod.json,
    (modFile) => modFile.name.replace(/\s\s/g, " ") == file.name,
    (match) => match.version.trim() == file.version.trim()
  );
  if (doubleSpaceMatch) return doubleSpaceMatch;

  // Typo fixes
  const typoMatch = fileFilter(
    mod.json,
    (modFile) => ModTypoFixes.has(modFile.name) && ModTypoFixes.get(modFile.name) == file.name,
    (match) => match.version == file.version
  );
  if (typoMatch) return typoMatch;

  // If we still haven't found it, then manual intervention is needed
  log("No matches", mod, file);
  throw new Error(`No matches found for ${file.name}`);
};
