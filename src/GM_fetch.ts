// fetch simplified into a GM_xmlhttpRequest call to bypass CORS issues.
// Response doesn't allow for setting URLs, so don' rely on it.
export const GM_fetch = async (url: RequestInfo | URL, options?: RequestInit | undefined) =>
  new Promise((resolve, reject) => {
    const method = (options?.method && ["HEAD", "POST"].includes(options.method) ? options.method : "GET") as "GET" | "HEAD" | "POST";
    const headers = {} as Record<string, string>;
    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers[key] = value;
      }
    }
    GM_xmlhttpRequest({
      method,
      url: url.toString(),
      headers: {
        // Set the info after loading the headers to keep it standard
        ...(options?.headers as Record<string, string>),
        "Application-Name": GM.info.script.name,
        "Application-Version": GM.info.script.version,
        "User-Agent": `${GM.info.script.namespace}/${GM.info.script.version} (${GM.info.scriptHandler}/${GM.info.version})`,
      },
      onload: (res) =>
        resolve(
          new Response(res.response, {
            status: res.status ?? 200,
            statusText: res.statusText ?? "OK",
            headers: Object.fromEntries(
              res.responseHeaders
                .trim()
                .split("\n")
                .map((line) => line.split(": "))
            ),
          })
        ),
      onerror: (res) => reject(res),
    });
  });
export default GM_fetch;
