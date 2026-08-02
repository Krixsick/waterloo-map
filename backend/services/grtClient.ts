import axios from "axios";
import https from "node:https";

const REQUEST_TIMEOUT_MS = 12_000;

// Keep compatibility with GRT's legacy TLS configuration scoped to this host.
const grtHttpsAgent = new https.Agent({
  ciphers: "DEFAULT@SECLEVEL=1",
  minVersion: "TLSv1.2",
});

export async function fetchGrtBuffer(url: string, accept: string) {
  const response = await axios.get<ArrayBuffer>(url, {
    headers: { Accept: accept },
    httpsAgent: grtHttpsAgent,
    responseType: "arraybuffer",
    timeout: REQUEST_TIMEOUT_MS,
  });

  return Buffer.from(response.data);
}
