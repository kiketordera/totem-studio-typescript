/**
 * The secret key layout, for the live smoke's credential checks:
 *
 *   tsk_live_<lookup id: 22 base62>_<secret: 43 base62><checksum: 6 base62>
 *
 * The checksum is the CRC-32 (IEEE, as zlib) of everything before it, in
 * base62, zero-padded to 6 characters. This mirrors the API's own key format
 * (Nuxt `shared/utils/publicApi/keyFormat.ts`), so the API refuses a key that
 * fails it without looking it up. A CRC is not a MAC: only the server's
 * secret check can refuse a well-formed key that carries a real lookup id.
 */
import { randomInt } from 'node:crypto';
import { crc32 } from 'node:zlib';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const PREFIX = 'tsk_live_';
const SECRET_LENGTH = 43;
const CHECKSUM_LENGTH = 6;
const TOKEN = /^tsk_live_([0-9A-Za-z]{22})_([0-9A-Za-z]{43})([0-9A-Za-z]{6})$/;

/** `crc32(body)` as exactly 6 base62 characters, zero-padded. */
export function checksumBase62(body) {
  let value = crc32(body);
  let out = '';
  for (let i = 0; i < CHECKSUM_LENGTH; i++) {
    out = BASE62[value % 62] + out;
    value = Math.floor(value / 62);
  }
  return out;
}

export function formatSecretKey(lookupId, secret) {
  const body = `${PREFIX}${lookupId}_${secret}`;
  return body + checksumBase62(body);
}

/** The parts of a well-formed live key, or null for another prefix, a wrong length or character, or a checksum mismatch. */
export function parseSecretKey(token) {
  const match = typeof token === 'string' ? TOKEN.exec(token) : null;
  if (!match || match[3] !== checksumBase62(token.slice(0, -CHECKSUM_LENGTH))) return null;
  return { lookupId: match[1], secret: match[2] };
}

/** A well-formed key with the same lookup id and a new random secret, so only the server's secret check can refuse it; null when `apiKey` is not well-formed. */
export function wrongSecretKey(apiKey) {
  const parsed = parseSecretKey(apiKey);
  if (!parsed) return null;
  let secret;
  do secret = Array.from({ length: SECRET_LENGTH }, () => BASE62[randomInt(BASE62.length)]).join('');
  while (secret === parsed.secret);
  return formatSecretKey(parsed.lookupId, secret);
}
