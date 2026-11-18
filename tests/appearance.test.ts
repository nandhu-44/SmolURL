import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { DEFAULT_APPEARANCE, PRESETS, PRESET_IDS, appearanceCss, contrastOfTokens, parseAppearance, tokens } from "../src/lib/appearance.ts";

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); console.log("✓", name); n++; };

for (const id of PRESET_IDS) {
  for (const dark of [false, true]) {
    ok(`${id} (${dark ? "dark" : "light"}): text is readable`, () => {
      const t = tokens(PRESETS[id], dark);
      assert.ok(contrastOfTokens(t["--primary"], t["--primary-foreground"]) >= 4.5, "text on accent buttons");
      assert.ok(contrastOfTokens(t["--foreground"], t["--background"]) >= 10, "body text");
      assert.ok(contrastOfTokens(t["--foreground"], t["--card"]) >= 10, "text on cards");
      assert.ok(contrastOfTokens(t["--muted-foreground"], t["--background"]) >= 4.5, "secondary text");
      assert.ok(contrastOfTokens(t["--muted-foreground"], t["--muted"]) >= 3.5, "secondary text on muted chips");
    });
  }
}
ok("custom accents of any lightness stay readable (yellow, white, black, neon)", () => {
  for (const accent of ["#ffff00", "#ffffff", "#000000", "#00ff00", "#ff00ff", "#7a5af8", "#808080"]) {
    for (const dark of [false, true]) {
      const t = tokens({ accent, hue: 200, tint: 20 }, dark);
      assert.ok(contrastOfTokens(t["--primary"], t["--primary-foreground"]) >= 4.5, `${accent} ${dark ? "dark" : "light"}`);
    }
  }
});
ok("parseAppearance rejects junk and clamps ranges", () => {
  const a = parseAppearance({ font: "comic-sans", theme: "nope", custom: { accent: "red; background:url(x)", hue: 9999, tint: -5 }, radius: 500 });
  assert.equal(a.font, DEFAULT_APPEARANCE.font); assert.equal(a.theme, DEFAULT_APPEARANCE.theme);
  assert.equal(a.custom.accent, DEFAULT_APPEARANCE.custom.accent); assert.equal(a.custom.hue, 360); assert.equal(a.custom.tint, 0); assert.equal(a.radius, 20);
  assert.deepEqual(parseAppearance(null), DEFAULT_APPEARANCE); assert.deepEqual(parseAppearance("x"), DEFAULT_APPEARANCE);
});
ok("generated CSS can't be injected through values", () => {
  const css = appearanceCss(parseAppearance({ theme: "custom", custom: { accent: "#123456</style><script>alert(1)</script>" }, font: "</style>" }));
  assert.ok(!css.includes("<") && !css.includes("script"));
});
ok("the stylesheet's built-in palette matches the default theme (first paint without a saved appearance)", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  for (const [selector, dark] of [[":root", false], [".dark", true]] as const) {
    const block = css.slice(css.indexOf(`${selector} {`), css.indexOf("}", css.indexOf(`${selector} {`)));
    for (const [name, value] of Object.entries(tokens(PRESETS[DEFAULT_APPEARANCE.theme as keyof typeof PRESETS], dark))) {
      assert.ok(block.includes(`${name}: ${value};`), `${selector} ${name} should be ${value}`);
    }
  }
});
console.log(`\n${n} appearance checks passed`);
