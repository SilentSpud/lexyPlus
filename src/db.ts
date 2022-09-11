import { IFileInfo } from "@nexusmods/nexus-api/lib/types";
import Dexie from "dexie";

export class LexyPlusData extends Dexie {
  mods!: Dexie.Table<Mod, number>;
  settings!: Dexie.Table<Settings, string>;

  constructor() {
    super("LexyPlus");

    this.version(1).stores({
      mods: "++mod, name, game, files, json, data",
      settings: "++key, value",
    });
  }
}
export type Mod = {
  //* Mod name
  name: string;
  //* Nexus mod ID
  mod: number;
  //* Nexus game code
  game: string;
  //* Nexus version
  version?: string;
  //* Nexus API files
  files: FileInfo[];
  //* Nexus API response. Temporary
  json: IFileInfo[];
};

export type FileInfo = {
  //* Nexus file ID
  id?: number;
  //* Nexus file name
  name: string;
  //* Nexus version
  version: string;
};
export interface Settings {
  key: string;
  value: string;
}
export default LexyPlusData;
