import fetch from "../GM_fetch";
import { IModFiles } from "@nexusmods/nexus-api/lib/types";
import { ModBox } from "../@types/lexy";
import { skipMods } from "../config";
import DB, { Mod, FileInfo } from "../db";
import log from "../logger";
import Nexus_Parse from "./parse";
const db = new DB();

export const Nexus = async (modItem: Mod | ModBox) => {
  if (skipMods.includes(modItem.name)) return;
  let modInfo = await db.mods.get(modItem.mod);
  if (!modInfo || !modInfo.json) {
    // If we don't have the mod or it's json, fetch it
    modInfo = { ...modItem } as Mod;
    const newInfo = await Nexus_Fetch(modInfo);
    modInfo.json = newInfo;
    await db.mods.put(modInfo);
  }

  // if any file doesn't have an id or a version, then we need to parse the json
  if (!!modInfo.files.filter(({ id, version }) => !id || !version).length) {
    const newFiles = await Nexus_Handler(modInfo, modItem.version);
    modInfo.files = newFiles;
    await db.mods.put(modInfo);
  }
  return modInfo;
};

const Nexus_Fetch = async (mod: Mod) => {
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

const Nexus_Handler = async (mod: Mod, ModVersion?: string) =>
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
    const { file_id } = Nexus_Parse(mod, fileData);
    fileData.id = file_id;
    return fileData;
  });
export default Nexus;
