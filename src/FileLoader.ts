import fetch from "./GM_fetch";
//@ts-ignore
import semverMax from "semver-max";
import DB, { File, Mod } from "./db";
import { ModResponse } from "./@types/nexus";
const db = new DB();
db.open();

const buildList = [
  "OMEGA AIO Updated",
]

export const Nexus_Mod = async (ModItem: Mod) => {
  let modInfo = await db.mods.get(ModItem.mod);
  if (!modInfo) {
    if (buildList.includes(ModItem?.name ?? "!NV@L!D CH@R@CT€R$")) {
      const newInfo = Nexus_Mod_Fetch(ModItem);
    }
  }
};

const Nexus_Mod_Fetch = async (mod: Mod) => {
  const filesRaw = await fetch(`https://api.nexusmods.com/v1/games/${mod.game}/mods/${mod.mod}/files.json`, {
    headers: { APIKey: sessionStorage.getItem("nexus-api-key") as string },
  });
  const json = (await filesRaw.json()) as ModResponse;
  mod.files.map(async (oldData) => {
    const fileData: File = {
      ...oldData,
    };

    let matches = json.files
      .filter(({ category_id }) => category_id !== 6) // Filter deleted mods
      .filter((file) => file.name === fileData.name); // Filter by name
    if (oldData.version === "") {
      const vers = matches
        .map(({ version }) => {
          console.log(fileData, version);
          return version;
        })
        .reduce(semverMax);
    }

    if (matches.length > 1) {
      const vers = matches
        .map(({ version }) => {
          return version;
        })
        .reduce(semverMax);
      fileData.version = vers;
      console.warn(fileData, matches, `Multiple matches for ${fileData.name}, calculated version ${vers}`);
      matches = matches.filter((file) => file.version === vers);
    }
    if (matches.length === 0) {
      console.error(fileData, `No match for ${fileData.name} ${fileData.version}`);
    } else
      matches.forEach((file) => {
        if (file.category_id !== fileData.category) {
          if (file.category_id == 4 || file.category_id == 7) return;
          console.error(file, fileData, `Mismatch! Page says ${fileData.category} but API says ${file.category_id}`);
        }
        //console.log(file);
      });
  });
};
