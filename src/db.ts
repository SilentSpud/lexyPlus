import Dexie, { Table } from 'dexie';

export class LexyPlusData extends Dexie {
  mods!: Table<Mod, number>;
  settings!: Table<Settings, number>;
  
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