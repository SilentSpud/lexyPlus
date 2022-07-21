import fetch from "./GM_fetch";

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
