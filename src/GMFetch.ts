const GMFetch = async (url: RequestInfo | URL, options?: RequestInit | undefined) => {
  const method = (options?.method && ["HEAD", "POST"].includes(options.method) ? options.method : "GET") as "GET" | "HEAD" | "POST";
  const headers = {} as Record<string, string>;
  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers[key] = value;
    }
  }
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method,
      url: url.toString(),
      headers: {
        // Set the info after loading the headers to keep it standard
        ...headers,
        "Application-Name": GM.info.script.name,
        "Application-Version": GM.info.script.version,
        "User-Agent": `${GM.info.script.namespace}/${GM.info.script.version} (${GM.info.scriptHandler}/${GM.info.version})`,
      },
      onload: (res) =>
        resolve(
          new Response(res.response, {
            status: res.status,
            statusText: res.statusText,
            headers: res.responseHeaders.split("\n").map((line) => line.split(": ")),
          })
        ),
    });
  });
};
export default GMFetch;
