import { ModBox } from "./@types/lexy";
import { FileInfo } from "./db";
import { modFilters } from "./FileLoader";
import Nexus from "./nexus";

const VersionRegex = new RegExp("https://img\\.shields\\.io/badge/Version-(.*)-informational\\.svg", "i");
const NexusRegex = new RegExp("https://www\\.nexusmods\\.com/(.*)/mods/(.*)(\\?.*)?", "i");

const parseFileDescriptor = (fileDescriptor: HTMLSpanElement): FileInfo => {
  const fileDesc = fileDescriptor.cloneNode(true) as HTMLSpanElement;
  fileDesc.querySelector(".mod-file-item-version-label")?.remove();

  const name = fileDesc.querySelector<HTMLSpanElement>(".mod-file-item-name")?.innerText ?? "A file";
  const version = fileDesc.querySelector<HTMLSpanElement>(".mod-file-item-version")?.innerText.trim() ?? "";
  return { name, version };
};

export const parseNexusMods = async () => {
  // filter out only mods with a nexus link
  const mods = Array.from(document.querySelectorAll<HTMLDivElement>(".mod-item")).filter((el) => !!el.querySelectorAll(`.mod-details > a[href^="https://www.nexusmods.com/"]`).length);

  mods.forEach(async (modElem) => {
    // get the mod name
    const modName = modElem.querySelector<HTMLHeadingElement>(".av-special-heading-tag")?.innerText ?? "";
    // if the filter list has mods, check it
    if (modFilters.length > 0 && !modFilters.includes(modName)) return;

    // get the nexus link and break it down to the mod id and game id
    const modLink = modElem.querySelector(`.mod-details > a[href^="https://www.nexusmods.com/"]`) as HTMLAnchorElement;

    const linkData = NexusRegex.exec(modLink.href);
    if (!linkData) throw new Error("Invalid Nexus Link");
    const [, gameId, modId] = linkData;

    // parse the files into something more searchable
    const files = Array.from(modElem.querySelectorAll<HTMLSpanElement>("span.mod-file-item")).map(parseFileDescriptor);

    const mod: ModBox = { name: modName, mod: parseInt(modId), game: gameId, files };

    modElem.querySelectorAll<HTMLImageElement>('img[src^="https://img.shields.io/badge/Version-"]').forEach((el) => {
      const verVal = VersionRegex.exec(el.src);
      if (verVal) mod.version = decodeURIComponent(verVal[1]).trim();
    });

    Nexus(mod);
  });
};
