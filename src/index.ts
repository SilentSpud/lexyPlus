import fetch from "./GM_fetch";

// Change the favicon link to use https
(() => {
  const icon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  icon.href = icon.href.replace("http:", "https:");
})();

document.querySelectorAll("strong").forEach((el) => {
  const selection = window.getSelection() as Selection;
  const range = document.createRange();
  el.addEventListener("click", () => {
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  });
});
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
