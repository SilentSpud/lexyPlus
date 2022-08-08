import Dexie from 'dexie';

export class LexyPlusData extends Dexie {
  mods!: Dexie.Table<Mod, number>;
  settings!: Dexie.Table<Settings, string>;
  
  constructor() {  
    super("LexyPlus");
    
    this.version(1).stores({
      mods: '++uid, file, mod, game, version',
      settings: '++key, value',
    });
  }
}
export interface Mod {
  uid?: number; // file unique id
  file: number; // file id
  mod: number; // mod id
  game: string; // game code
  version: string; // mod version
}
export interface Settings {
  key: string;
  value: string;
}
export default LexyPlusData;