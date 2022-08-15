import Dexie from "dexie";
import { ModResponse, FileData } from "./@types/nexus";

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
  name: string;
  mod: number;
  game: string;
  files: File[];
  json: FileData[];
  data?: ModResponse;
}

export type File = {
  id?: number;
  name: string;
  version: string;
  category: 1 | 2 | 3 | 4 | 5 | undefined;
}
export interface Settings {
  key: string;
  value: string;
}
export default LexyPlusData;
