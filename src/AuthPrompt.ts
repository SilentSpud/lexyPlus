const ShowAuthPrompt = () => {
  const prompt = document.createElement("div");
  prompt.classList.add("lotdplus-frame");
  prompt.style.cssText = `position: fixed; display: block; top: 0; left: 0; bottom: 0; right: 0; background-color: rgba(0, 0, 0, 0.3); user-select: none; z-index: 10;`;
  prompt.innerHTML = `
    <div class="lotdplus-dialog" style="margin: 10vh auto; position: fixed; top: 25%; left: 25%; width: 50vw; z-index: 999; background-olor: #DDD; padding: 1em; border-radius: 0.5em; font-size: 14pt; user-select: unset;>
      <p style="margin-top: 0;">Lexy+ queries the Nexus Mods API to attempt to create nxm links for all mods on the page. This requires your <a href="https://www.nexusmods.com/users/myaccount?tab=api#personal_key" target="_blank">Nexus Mods API key</a><br />
        Your key's stored in your browser's session storage.<br />
        Any generated nxm links are stored in a database your browser's local storage, so they'll persist until you clear your browser data.</p>
      <input type="text" placeholder="API Key" id="lotdplus-apikey" />
      <button class="lotdplus-yes">Continue</button>
      <button class="lotdplus-no">No thanks</button>
    </div>`;
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
  });
};
export default ShowAuthPrompt;
