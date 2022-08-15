import fetch from "./GM_fetch";
//@ts-ignore
import semverMax from "semver-max";
import DB, { File, Mod } from "./db";
import { ModResponse } from "./@types/nexus";
const db = new DB();
db.open();

const filters = [
  "Better Combat Escape - SSE",
  "Sovngarde - A Nordic Font",
]

export const NexusMod = async (ModItem: Mod) => {
  let modInfo = await db.mods.get(ModItem.mod);

  // If we don't have the mod or it's json, fetch it
  if (!modInfo || !modInfo.json) {
    modInfo = { ...ModItem };
    const newInfo = await NexusMod_Fetch(ModItem);
    modInfo.json = newInfo;
    await db.mods.put(modInfo);
  }

  // if any file doesn't have an id or a version, then we need to parse the json
  if (!!modInfo.files.filter(({ id, version }) => !id || !version).length && filters.includes(modInfo.name)) {
    const newFiles = await NexusMod_Parse(modInfo);
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

const NexusMod_Parse = async (mod: Mod) =>
  mod.files.map((oldData) => {
    const fileData: File = {
      ...oldData,
    };
    const hasVersion = oldData.version !== "";
    try {
      let matches = mod.json
        .filter(({ category_id }) => category_id !== 6) // Filter out deleted mods
        .filter((file) => file.name === fileData.name); // Filter by name

      // If there's no version given, then find the highest version on nexus and use it
      if (oldData.version === "") {
        const vers = matches.map(({ version }) => version);
        const max = semverMax(...vers);
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
