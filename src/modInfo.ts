import fetch from "./GM_fetch";


const mods = Array.from(document.querySelectorAll(".mod-item")).filter((el) => !!el.querySelectorAll(`.mod-details > a[href^="https://www.nexusmods.com/"]`).length);
