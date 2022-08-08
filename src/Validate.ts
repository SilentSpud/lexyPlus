import fetch from "./GM_fetch";

// Validate the API key and verify that they have premium
export const Validate = () =>
  new Promise<true | string>(async (accept, reject) => {
    const APIKey = sessionStorage.getItem("nexus-api-key");
    if (!APIKey || APIKey.length === 0) {
      return accept("No API key found");
    }
    const resp = await fetch("https://api.nexusmods.com/v1/users/validate.json", {
      headers: { APIKey },
    });
    if (resp.status !== 200) return accept("Invalid API key");

    const json = await resp.json();

    if (!json.is_premium) return accept("Nexus Premium is required");

    return accept(true);
  });
export default Validate;
