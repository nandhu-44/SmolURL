import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Reads the colour tokens straight from the stylesheet and checks every text/background pair against WCAG AA.
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf("}", start));
};
const tokens = (selector: string) => Object.fromEntries([...block(selector).matchAll(/--([\w-]+):\s*([\d.]+) ([\d.]+)% ([\d.]+)%;/g)].map((m) => [m[1], [+m[2], +m[3], +m[4]]])) as Record<string, number[]>;

function rgb([h, s, l]: number[]) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map((n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
}
const lum = (c: number[]) => { const [r, g, b] = rgb(c).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const PAIRS: [string, string][] = [
  ["foreground", "background"], ["foreground", "card"], ["foreground", "popover"],
  ["muted-foreground", "background"], ["muted-foreground", "card"], ["muted-foreground", "muted"],
  ["primary", "background"], ["primary", "card"], ["primary-foreground", "primary"],
  ["destructive", "card"], ["success", "card"],
];

let n = 0;
for (const [selector, label] of [[":root", "light"], [".dark", "dark"]]) {
  const t = { ...tokens(":root"), ...tokens(selector) };
  for (const [fg, bg] of PAIRS) {
    const ratio = contrast(t[fg], t[bg]);
    assert.ok(ratio >= 4.5, `${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs 4.5:1`);
    n++;
  }
  console.log(`✓ ${label}: every text pair meets WCAG AA (4.5:1)`);
}
console.log(`\n${n} contrast checks passed`);
