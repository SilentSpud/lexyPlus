import he from "he";
import { coerce } from "semver";
import { VersionTypoFixes, ModTypoFixes } from "../config";
import { Mod, FileInfo } from "../db";
import { fileFilter, versionRegex } from "../FileLoader";
import log from "../logger";

const Nexus_Parse = (mod: Mod, file: FileInfo) => {
  // Look for a matching version
  const versionMatch = fileFilter(
    mod.json,
    (modFile) => modFile.version == file.version,
    // If there's more than 1, try filtering by name.
    (match) => match.name.toLowerCase() == file.name.toLowerCase(),
    // Add the version to the name. Fixes "Riften Docks Overhaul"
    (match) => match.name == `${file.name} ${file.version}`,
    // Add the version to the name but with a v this time. Fixes "Farmhouse Chimneys"
    (match) => match.name == `${file.name} v${file.version}`,
    // Decode any html entities in the name
    (match) => he.decode(match.name) == file.name
  );
  if (versionMatch) return versionMatch;

  // Look for a matching name
  const nameMatch = fileFilter(
    mod.json,
    (modFile) => modFile.name.toLowerCase() == file.name.toLowerCase(),
    // If there's more than 1, try filtering by version.
    (match) => match.version == file.version,
    // check if the file's in the version typo list, and if so, test that version instead
    (match) => VersionTypoFixes.has(file.name) && match.version == VersionTypoFixes.get(file.name)
  );
  if (nameMatch) return nameMatch;

  // Look for a matching semver
  const semverMatch = fileFilter(
    mod.json,
    (match) => coerce(match.version)?.raw === coerce(file.version)?.raw,
    // If there's more than 1, try filtering by name.
    (match) => match.name.trim() == file.name.trim()
  );
  if (semverMatch) return semverMatch;

  // Test for files wrongly formatted with the version in the name
  if (versionRegex.test(file.name)) {
    const [verString, , , verValue] = versionRegex.exec(file.name) as RegExpExecArray;
    const fileName = file.name.replace(verString, "").trim();
    const regexMatch = fileFilter(
      mod.json,
      (modFile) => coerce(modFile.version)?.raw == coerce(verValue)?.raw,
      // If there's more than 1, try filtering by name.
      (match) => match.name.trim() == file.name.trim(),
      // Now try with the version stripped
      (match) => match.name.trim() == fileName
    );
    if (regexMatch) return regexMatch;
  }

  // Test for files with double spaces in the nexus file name. This eliminates several manual substitutions
  const doubleSpaceMatch = fileFilter(
    mod.json,
    (modFile) => modFile.name.replace(/\s\s/g, " ") == file.name,
    (match) => match.version.trim() == file.version.trim()
  );
  if (doubleSpaceMatch) return doubleSpaceMatch;

  // Typo fixes
  const typoMatch = fileFilter(
    mod.json,
    (modFile) => ModTypoFixes.has(modFile.name) && ModTypoFixes.get(modFile.name) == file.name,
    (match) => match.version == file.version
  );
  if (typoMatch) return typoMatch;

  // If we still haven't found it, then manual intervention is needed
  log("No matches", mod, file);
  throw new Error(`No matches found for ${file.name}`);
};
export default Nexus_Parse;
