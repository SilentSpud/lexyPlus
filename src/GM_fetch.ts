/**
 * fetch polyfill utilizing GM_xmlhttpRequest to bypass CORS issues
 *
 * @param {(RequestInfo | URL)} url
 * @param {(RequestInit | undefined)} [options]
 */
export const GM_fetch = async (url: RequestInfo | URL, options?: RequestInit | undefined) =>
  new Promise<Response>((resolve, reject) => {
    // These are the only methods supported by GM_xmlhttpRequest
    const method = (options?.method && ["HEAD", "POST"].includes(options.method) ? options.method : "GET") as "GET" | "HEAD" | "POST";
    const Req: Tampermonkey.Request<any> = {
      method,
      url: url.toString(),
      headers: {
        // Set the info after loading the headers to keep it standard
        ...(options?.headers as Record<string, string>),
        "Application-Name": GM.info.script.name,
        "Application-Version": GM.info.script.version,
        "User-Agent": `${GM.info.script.namespace}/${GM.info.script.version} (${GM.info.scriptHandler}/${GM.info.version})`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Create a Response object from the GM_xmlhttpRequest response
      onload: (res) => {
        const response = new Response(res.response, {
          status: res.status ?? 200,
          statusText: res.statusText ?? "OK",
          headers: Object.fromEntries(
            res.responseHeaders
              .trim()
              .split("\n")
              .map((line) => line.split(": "))
          ),
        });
        Object.defineProperty(response, "url", { value: url.toString() });
        resolve(response);
      },
      onerror: (res) => reject(res),
    };

    GM_xmlhttpRequest(Req);
  });
export default GM_fetch;
