import { randomInt, randomUUID } from "node:crypto";

const captchaStore = new Map<string, { answer: string; expiresAt: number }>();
const captchaCharset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const captchaLength = 4;
const captchaTtlMs = 3 * 60 * 1000;

export interface CaptchaChallenge {
  captchaId: string;
  expiresInSeconds: number;
  svg: string;
}

export function createCaptchaChallenge(): CaptchaChallenge {
  pruneExpiredCaptchas();

  const answer = Array.from({ length: captchaLength }, () =>
    captchaCharset[randomInt(captchaCharset.length)],
  ).join("");
  const captchaId = randomUUID();

  captchaStore.set(captchaId, {
    answer,
    expiresAt: Date.now() + captchaTtlMs,
  });

  return {
    captchaId,
    expiresInSeconds: Math.floor(captchaTtlMs / 1000),
    svg: renderCaptchaSvg(answer),
  };
}

export function verifyCaptcha(captchaId: string, input: string) {
  pruneExpiredCaptchas();

  const record = captchaStore.get(captchaId);
  captchaStore.delete(captchaId);

  if (!record || record.expiresAt < Date.now()) {
    return false;
  }

  return record.answer === normalizeCaptchaInput(input);
}

function pruneExpiredCaptchas() {
  const now = Date.now();

  for (const [captchaId, record] of captchaStore.entries()) {
    if (record.expiresAt <= now) {
      captchaStore.delete(captchaId);
    }
  }
}

function normalizeCaptchaInput(input: string) {
  return input.trim().toUpperCase();
}

function renderCaptchaSvg(answer: string) {
  const width = 132;
  const height = 46;
  const noiseLines = Array.from({ length: 5 }, (_, index) => {
    const x1 = randomInt(8, width - 8);
    const y1 = randomInt(6, height - 6);
    const x2 = randomInt(8, width - 8);
    const y2 = randomInt(6, height - 6);
    const opacity = (0.12 + index * 0.03).toFixed(2);

    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b45309" stroke-width="1" opacity="${opacity}" />`;
  }).join("");

  const noiseDots = Array.from({ length: 18 }, () => {
    const cx = randomInt(6, width - 6);
    const cy = randomInt(6, height - 6);
    const radius = randomInt(1, 3);
    const opacity = (0.08 + randomInt(0, 12) / 100).toFixed(2);

    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#7c2d12" opacity="${opacity}" />`;
  }).join("");

  const glyphs = answer
    .split("")
    .map((character, index) => {
      const x = 22 + index * 26;
      const y = randomInt(28, 36);
      const rotate = randomInt(-18, 19);
      const fontSize = randomInt(23, 28);

      return `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="'Segoe UI', 'PingFang SC', sans-serif" font-weight="700" fill="#292524" transform="rotate(${rotate} ${x} ${y})">${character}</text>`;
    })
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="验证码">`,
    `<rect width="${width}" height="${height}" rx="8" fill="#fefaf4" />`,
    `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="7" fill="none" stroke="#e7d6bf" />`,
    `<path d="M8 34 C28 12 48 12 68 34 S108 54 124 20" stroke="#fb923c" stroke-width="1.2" fill="none" opacity="0.25" />`,
    noiseLines,
    noiseDots,
    glyphs,
    `</svg>`,
  ].join("");
}
