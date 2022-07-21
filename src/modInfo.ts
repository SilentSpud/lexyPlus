/*import Dexie from "dexie";

const db = new Dexie("LexyPlus");
db.version(1).stores({ mods: `file, mod, game, name` });*/

export const ShowPrompt = async () => {
  if (sessionStorage.getItem("lexyPlus/enabled") !== "true" && sessionStorage.getItem("lexyPlus/prompt") !== "true") {
    const prompt = document.createElement("div");
    prompt.classList.add("lotdplus-frame");
    prompt.innerHTML = `
  <style>
    .lotdplus-frame { position: fixed; display: block; top: 0; left: 0; bottom: 0; right: 0; background-color: rgba(0, 0, 0, 0.3); user-select: none; z-index: 10; }
    .lotdplus-dialog { margin: 10vh auto; position: fixed; top: 25%; left: 25%; width: 50vw; z-index: 999; background-color: #DDD; padding: 1em; border-radius: 0.5em; font-size: 14pt; user-select: unset; }
    .lotdplus-dialog > p { margin-top: 0; }
  </style>
  <div class="lotdplus-dialog">
    <p>Lexy+ queries the Nexus Mods API to attempt to create nxm links for all mods on the page. This requires your <a href="https://www.nexusmods.com/users/myaccount?tab=api#personal_key" target="_blank">Nexus Mods API key</a><br/>
    Your key's stored in your browser's session storage, so once you close the window, it's gone.<br/>
    Any generated nxm links are stored in a database your browser's local storage, so they'll persist until you clear your browser data.</p>
    <input type="text" placeholder="API Key" id="lotdplus-apikey" />
    <button class="lotdplus-yes">Continue</button>
    <button class="lotdplus-no">No thanks</button>
  </div>
  `;
    document.body.appendChild(prompt);
    const yesBtn = prompt.querySelector(".lotdplus-yes") as HTMLButtonElement;
    const noBtn = prompt.querySelector(".lotdplus-no") as HTMLButtonElement;
    const apiKey = prompt.querySelector("#lotdplus-apikey") as HTMLInputElement;
    noBtn.addEventListener("click", () => {
      sessionStorage.setItem("lexyPlus/prompt", "true");
      prompt.remove();
    });
    yesBtn.addEventListener("click", () => {
      if (apiKey.value.length === 0) {
        alert("Please enter your API key");
        return;
      }
      sessionStorage.setItem("lexyPlus/prompt", "true");
      sessionStorage.setItem("lexyPlus/apiKey", apiKey.value);
      prompt.remove();
      Validate();
    });
  }
};

// Validate the API key and verify that they have premium
export const Validate = async () => {
  const apiKey = sessionStorage.getItem("lexyPlus/apiKey");
  if (apiKey === null) {
    throw new Error("No API key found");
  }
  GM.xmlHttpRequest({
    method: "GET",
    url: "https://api.nexusmods.com/v1/users/validate.json",
    headers: {
      "Application-Name": "LOTD+",
      "Application-Version": "0.1.0",
      "User-Agent": `LOTDPlus/0.1.0 (${GM.info.scriptHandler}/${GM.info.version})`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    onload: function (response) {
      if (response.status !== 200) {
        alert("Invalid API key");
        return ShowPrompt();
      }
      const data = JSON.parse(response.responseText);
      if (!data.is_premium) {
        alert("You need to have premium to use this script");
        return ShowPrompt();
      }
      sessionStorage.setItem("lexyPlus/enabled", "true");
      sessionStorage.setItem("lexyPlus/apiKey", apiKey);
      localStorage.setItem("lexyPlus/userID", data.user_id);
      processPage();
    },
  });
};
const processPage = async () => {};

const mods = Array.from(document.querySelectorAll(".mod-item")).filter((el) => !!el.querySelectorAll(`.mod-details > a[href^="https://www.nexusmods.com/"]`).length);
