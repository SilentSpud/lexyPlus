import { File } from "./db";

export type ModBox = {
  name: string;
  game: string;
  mod: number;
  version?: string;
  files: File[];
};
