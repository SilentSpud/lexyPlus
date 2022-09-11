import fetch from "./GM_fetch";
import AuthPrompt from "./AuthPrompt";
import Validate from "./Validate";
import DB from "./db";
import { parseNexusMods } from "./modInfo";
const db = new DB();

// NXM Link: nxm://<GAME CODE>/mods/<MOD ID>/files/<FILE ID>
console.clear();
console.log("Starting Lexy+");

// Change the favicon link to use https (unless it's already fixed)
document.querySelectorAll<HTMLLinkElement>(`link[rel~="icon"][href^="http:"]`).forEach((el) => {
  el.href = el.href.replace("http:", "https:");
});

document.querySelectorAll("strong").forEach((el) => {
  const selection = window.getSelection() as Selection;
  const range = document.createRange();
  el.addEventListener("click", () => {
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  });
});
const init = async () => {
  const isValid = await Validate();
  if (isValid !== true) {
    if (!(await AuthPrompt(isValid))) {
      return;
    }
  }
  parseNexusMods();
};
const isDisabled = await db.settings.get("disable");
if (isDisabled?.value === "true") {
  console.warn("Lexy+ is disabled");
} else {
  init();
}
export default {};
