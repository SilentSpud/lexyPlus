import fetch from "./GM_fetch";
//@ts-ignore
import semverMax from "semver-max";
import DB, { File, Mod } from "./db";
import { ModResponse } from "./@types/nexus";
const db = new DB();
db.open();

//const buildList = ["OMEGA Updated", "Teldryn Serious Patch"];

export const Nexus_Mod = async (ModItem: Mod) => {
  let modInfo = await db.mods.get(ModItem.mod);
  if (!modInfo) {
    modInfo = { ...ModItem };
    //if (buildList.includes(ModItem?.name)) {
    const newInfo = await Nexus_Mod_Fetch(ModItem);
    modInfo.json = newInfo;
    await db.mods.put(modInfo);
    //}
  } 
  //return Nexus_Mod_Parse(modInfo);
};

const Nexus_Mod_Fetch = async (mod: Mod) => {
  const filesRaw = await fetch(`https://api.nexusmods.com/v1/games/${mod.game}/mods/${mod.mod}/files.json`, {
    headers: { APIKey: sessionStorage.getItem("nexus-api-key") as string },
  });
  const json = (await filesRaw.json()) as ModResponse;
  return json.files;
};

const Nexus_Mod_Parse = async (mod: Mod) => {
  const newFiles = mod.files.map((oldData) => {
    const fileData: File = {
      ...oldData,
    };

    if (!mod.json) {
      throw new Error("No json found");
    }
    let matches = mod.json
      .filter(({ category_id }) => category_id !== 6) // Filter deleted mods
      .filter((file) => file.name === fileData.name); // Filter by name
    // If there's no version given, then find the highest version on nexus and use it
    if (oldData.version === "") {
      const vers = matches.map(({ version }) => version);
      const max = semverMax(...vers);
      fileData.version = max;
    }
    if (!fileData.version) console.error("No version found for", fileData.name);
    matches = matches.filter((file) => file.version === fileData.version);

    if (matches.length > 1) {
      console.warn(fileData, matches, `Multiple matches for ${fileData.name}`);
    }
    if (matches.length === 0) {
      console.error(fileData);
      throw new Error(`No match for ${fileData.name} ${fileData.version}`);
    } else
      matches.forEach((file) => {
        if (file.category_id !== fileData.category) {
          if (file.category_id == 4) return console.warn(`${fileData.name} is marked old now.`);
          if (file.category_id == 7) return console.warn(`${fileData.name} is marked archived now.`);
          console.warn(file, fileData, `Mismatch! Page says ${fileData.category} but API says ${file.category_id}`);
        }
        //console.log(file);
      });
    return fileData;
  });
  mod.files = newFiles;
  return mod;
};
