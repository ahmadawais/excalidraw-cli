import { deflateSync } from "node:zlib";

/**
 * Export an Excalidraw JSON file to excalidraw.com and return a shareable URL.
 * @param json - Serialized Excalidraw JSON string
 * @returns Shareable URL
 */
export async function exportToUrl(json: string): Promise<string> {
  // --- Excalidraw v2 binary format ---
  const concatBuffers = (...bufs: Uint8Array[]): Uint8Array => {
    let total = 4; // version header
    for (const b of bufs) total += 4 + b.length;
    const out = new Uint8Array(total);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, 1); // CONCAT_BUFFERS_VERSION = 1
    let off = 4;
    for (const b of bufs) {
      dv.setUint32(off, b.length);
      off += 4;
      out.set(b, off);
      off += b.length;
    }
    return out;
  };
  const te = new TextEncoder();

  // 1. Inner payload: concatBuffers(fileMetadata, data)
  const fileMetadata = te.encode(JSON.stringify({}));
  const dataBytes = te.encode(json);
  const innerPayload = concatBuffers(fileMetadata, dataBytes);

  // 2. Compress inner payload with zlib deflate
  const compressed = deflateSync(Buffer.from(innerPayload));

  // 3. Generate AES-GCM 128-bit key + encrypt
  const cryptoKey = await globalThis.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 128 },
    true,
    ["encrypt"],
  );
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    compressed,
  );

  // 4. Encoding metadata
  const encodingMeta = te.encode(
    JSON.stringify({
      version: 2,
      compression: "pako@1",
      encryption: "AES-GCM",
    }),
  );

  // 5. Outer payload: concatBuffers(encodingMeta, iv, encryptedData)
  const payload = Buffer.from(
    concatBuffers(encodingMeta, iv, new Uint8Array(encrypted)),
  );

  // 6. Upload to excalidraw backend
  const res = await fetch("https://json.excalidraw.com/api/v2/post/", {
    method: "POST",
    body: payload,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const { id } = (await res.json()) as { id: string };

  // 7. Export key as base64url string
  const jwk = await globalThis.crypto.subtle.exportKey("jwk", cryptoKey);
  return `https://excalidraw.com/#json=${id},${jwk.k}`;
}
