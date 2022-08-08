import fetch from "./GM_fetch";
import ShowAuthPrompt from "./AuthPrompt"
import LexyPlusData from "./db";

// NXM Link: nxm://<GAME CODE>/mods/<MOD ID>/files/<FILE ID>

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

ShowAuthPrompt();
const Data = new LexyPlusData();

const APIKey = sessionStorage.getItem("lexyPlus/apiKey") as string;
fetch("https://api.nexusmods.com/v1/users/validate.json", {
  headers: {
    APIKey,
  },
}).then(
  (res) => console.log(res),
  (err) => console.error(err)
);

export default {};
