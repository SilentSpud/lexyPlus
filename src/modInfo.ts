import { File, Mod } from "./db";
import { Nexus_Mod } from "./FileLoader";

const parseFileDescriptor = (fileDescriptor: HTMLSpanElement): File => {
  const fileDesc = fileDescriptor.cloneNode(true) as HTMLSpanElement;
  fileDesc.querySelector(".mod-file-item-version-label")?.remove();
  // Categories are a regex of how they appear in the output, as we're doing 1 request and reusing the output for every file
  const category = ((input: string) => {
    switch (input) {
      case "Main Files":
        return 1;
      case "Update Files":
        return 2;
      case "Optional Files":
        return 3;
      case "Old Files":
        return 4;
      case "Miscellaneous Files":
        return 5;
      default:
        return undefined;
    }
  })(fileDesc.querySelector<HTMLSpanElement>(".mod-file-item-category")?.innerText ?? "");
  const name = fileDesc.querySelector<HTMLSpanElement>(".mod-file-item-name")?.innerText ?? "A file";
  const version = fileDesc.querySelector<HTMLSpanElement>(".mod-file-item-version")?.innerText ?? "";
  return { name, version, category };
};

export const parseNexusMods = async () => {
  // filter out only mod entries on nexus
  const mods = Array.from(document.querySelectorAll<HTMLDivElement>(".mod-item")).filter((el) => !!el.querySelectorAll(`.mod-details > a[href^="https://www.nexusmods.com/"]`).length);
  mods.forEach(async (modElem) => {
    const modLink = modElem.querySelector(`.mod-details > a[href^="https://www.nexusmods.com/"]`) as HTMLAnchorElement;
    const [gameId, modId] = modLink.href.split("?")[0]
      .replace("https://www.nexusmods.com/", "") // Remove the start of the link
      .replace("/mods", "") // and the middle
      .split("/") // split the remainder into the game and mod id
      .map((s) => parseInt(s) || String(s).toString()) as [string, number]; // parse the mod id as number and the game id as string
      
    const files = Array.from(modElem.querySelectorAll<HTMLSpanElement>("span.mod-file-item")).map(parseFileDescriptor);

    const mod: Mod = { mod: modId, game: gameId, files };
    const output = await Nexus_Mod(mod);
  });
};
