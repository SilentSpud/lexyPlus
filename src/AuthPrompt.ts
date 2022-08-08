import DB from "./db";
const db = new DB();

const AuthPrompt = (validateMsg: string) =>
  new Promise<string>(async (accept, reject) => {
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(
      `
    <div class="lotdplus-frame" style="position: fixed; display: block; top: 0; left: 0; bottom: 0; right: 0; background-color: rgba(0, 0, 0, 0.5); user-select: none; z-index: 998;">
    <div class="lotdplus-dialog" style="margin: 10vh auto; position: fixed; top: 25%; left: 25%; width: 50vw; z-index: 999; background-color: #DDD; padding: 1em; border-radius: 0.5em; font-size: 14pt; user-select: unset;">
      <p style="margin-top: 0;">Validator failed with message: ${validateMsg}</p>
      <p>Lexy+ queries the Nexus Mods API to attempt to create nxm links for all mods on the page. This requires your <a href="https://www.nexusmods.com/users/myaccount?tab=api#personal_key" rel="noopener noreferrer" target="_blank">Nexus Mods API key</a><br />
        Your key's stored in your browser's session storage.<br />
        Any generated nxm links are stored in a local database, so they won't need to update until Lexy updates her guide.</p>
      <p>This script also has some QoL features for the site, so you can disable this and still use those features.</p>
      <input type="text" placeholder="API Key" id="lotdplus-apikey" />
      <div class="lotdplus-nobox alternate_color" style="background-color: #00000000; float: left; "></div>
      <div class="lotdplus-yesbox alternate_color" style="background-color: #00000000; float: right;"></div>

    </div>`,
      "text/html"
    );
    const prompt = htmlDoc.querySelector("div.lotdplus-frame") as HTMLDivElement;
    prompt.addEventListener("click", ({ target }) => {
      if (target === prompt) {
        prompt.remove();
        reject("User closed prompt");
      }
    });
    const yesBtn = document.createElement("button");
    yesBtn.classList.add("lotdplus-yes", "button");
    yesBtn.innerText = "Continue";
    yesBtn.addEventListener("click", () => {
      const key = prompt.querySelector<HTMLInputElement>("#lotdplus-apikey")?.value;
      if (key) {
        sessionStorage.setItem("nexus-api-key", key);
        prompt.remove();
        accept(key);
      }
    });
    (prompt.querySelector("div.lotdplus-yesbox") as HTMLDivElement).appendChild(yesBtn);
    const noBtn = document.createElement("button");
    noBtn.style.cssText = "background-color: #ed3e3a; color: #ffffff; border-color: #b30012;";
    noBtn.classList.add("lotdplus-no", "button");
    noBtn.innerText = "No thanks";
    noBtn.addEventListener("click", () => {
      db.settings.put({ key: "disable", value: "true" });
      prompt.remove();
      reject("User closed prompt");
    });
    (prompt.querySelector("div.lotdplus-nobox") as HTMLDivElement).appendChild(noBtn);
    document.body.appendChild(prompt);
  });
export default AuthPrompt;
