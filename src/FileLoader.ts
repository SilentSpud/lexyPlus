import fetch from "./GM_fetch";
//@ts-ignore
import semverMax from "semver-max";
import { distance } from "fastest-levenshtein";
import type { ModResponse } from "./@types/nexus";
import type { ModBox } from "./@types/lexy";
import DB, { FileInfo, Mod } from "./db";

const db = new DB();

const filters: string[] = ["CritterSpawn Congestion Fix"];
//const filters = ["Better Combat Escape - SSE", "Sovngarde - A Nordic Font"];

export const NexusMod = async (ModItem: Mod | ModBox) => {
  let modInfo = await db.mods.get(ModItem.mod);
  if (!modInfo || !modInfo.json) {
    // If we don't have the mod or it's json, fetch it
    modInfo = { ...ModItem } as Mod;
    const newInfo = await NexusMod_Fetch(modInfo);
    modInfo.json = newInfo;
    await db.mods.put(modInfo);
  }

  // if any file doesn't have an id or a version, then we need to parse the json
  if (!!modInfo.files.filter(({ id, version }) => !id || !version).length && (filters.length > 0 ? filters.includes(modInfo.name) : true)) {
    const newFiles = await NexusMod_Parse(modInfo, ModItem.version);
    modInfo.files = newFiles;
    await db.mods.put(modInfo);
  }
  return modInfo;
};

const NexusMod_Fetch = async (mod: Mod) => {
  const filesRaw = await fetch(`https://api.nexusmods.com/v1/games/${mod.game}/mods/${mod.mod}/files.json`, {
    headers: { APIKey: sessionStorage.getItem("nexus-api-key") as string },
  });
  const json = (await filesRaw.json()) as ModResponse;
  return json.files;
};

const NexusMod_Parse = async (mod: Mod, ModVersion?: string) =>
  mod.files.map((NexusFileData) => {
    const fileData: FileInfo = {
      ...NexusFileData,
    };
    const hasVersion = NexusFileData.version !== "";
    try {
      let matches = mod.json
        .filter(({ category_id }) => category_id !== 6) // Filter out deleted mods
        .filter((file) => distance(file.name.toLowerCase(), fileData.name.toLowerCase()) < 10); // Filter by name

      if (!NexusFileData.version && ModVersion) {
        console.log(`${mod.name} has no version, but has version ${ModVersion} in the modbox. Trying it`);
        fileData.version = ModVersion;
      }

      // If there's no version given, then find the highest version on nexus and use it
      if (!fileData.version) {
        const vers = matches.map(({ version }) => version);
        if (vers.length === 0) {
          console.error(`No version found for ${fileData.name}`, fileData);
          throw new Error(`No version found for ${fileData.name}`);
        }
        const max = vers.length === 1 ? vers[0] : semverMax(...vers);
        console.log(`${fileData.name} has no version, using ${max}`);
        fileData.version = max;
      }

      // If there's no version still, something is horribly wrong
      if (!fileData.version) throw new Error(`No version found for ${fileData.name}`);

      matches = matches.filter((file) => file.version === fileData.version);

      if (matches.length > 1) {
        console.warn(fileData, matches, `Multiple matches for ${fileData.name}`);
      }
      if (matches.length === 0) {
        console.error(fileData);
        throw new Error(`No match for ${fileData.name} ${fileData.version}`);
      } else
        matches.forEach((file) => {
          // just return these until i decide what to do
          if (file.category_id !== fileData.category) {
            if (file.category_id == 4) return console.warn(`${fileData.name} is marked old now.`);
            if (file.category_id == 7) return console.warn(`${fileData.name} is marked archived now.`);
            console.warn(file, fileData, `Mismatch! Page says ${fileData.category} but API says ${file.category_id}`);
          }
          fileData.id = file.file_id;
          //console.log(file);
        });
      return fileData;
    } catch (e: any) {
      console.error("Current data", fileData);
      throw new Error(`Mod "${mod.name}" has an error: "${e.toString()}". This mod ${hasVersion ? "did" : "didn't"} have a version.`);
    }
  });
