import fetch from "./GM_fetch";

// Validate the API key and verify that they have premium
export const Validate = async () => {
  const APIKey = sessionStorage.getItem("lexyPlus/apiKey");
  if (APIKey === null) {
    throw new Error("No API key found");
  }
  const resp = await fetch("https://api.nexusmods.com/v1/users/validate.json", {
    headers: {
      APIKey,
    },
  });
  if (resp.status !== 200) {
    alert("Invalid API key");
    return false;
  }
  const json = await resp.json();

  if (!json.is_premium) {
    alert("You need to have premium to use this script");
    sessionStorage.removeItem("lexyPlus/apiKey");
    sessionStorage.removeItem("lexyPlus/prompt");
    return false;
  }
  sessionStorage.setItem("lexyPlus/enabled", "true");
  sessionStorage.setItem("lexyPlus/apiKey", json.key);
};

const mods = Array.from(document.querySelectorAll(".mod-item")).filter((el) => !!el.querySelectorAll(`.mod-details > a[href^="https://www.nexusmods.com/"]`).length);
