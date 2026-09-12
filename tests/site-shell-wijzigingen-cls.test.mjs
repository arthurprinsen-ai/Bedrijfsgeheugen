import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("wijzigingen uitgelegd reserves tablet rail height before JS populates buttons", async()=>{
  const html=await readFile(new URL("../wijzigingen-uitgelegd.html",import.meta.url),"utf8");
  const rail=html.match(/\.rail\{([^}]*)\}/)?.[1]||"";
  assert.match(rail,/min-height\s*:\s*76px/i,"empty progress rail must reserve final button height before hydration to prevent tablet CLS");
});
