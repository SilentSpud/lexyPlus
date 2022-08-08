import Dexie from "dexie";

export class LexyPlusData extends Dexie {
  mods!: Dexie.Table<Mod, number>;
  settings!: Dexie.Table<Settings, string>;

  constructor() {
    super("LexyPlus");

    this.version(3).stores({
      mods: "++mod, game, files",
      settings: "++key, value",
    });
  }
}
export type Mod = {
  // TODO: implement name
  name: string;
  mod: number;
  game: string;
  files: File[];
  //* transient property; not stored in database
  data?: Record<any, any>;
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
