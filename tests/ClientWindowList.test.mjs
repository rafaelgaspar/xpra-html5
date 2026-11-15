/*
 * This file is part of Xpra.
 * Copyright (C) 2026 Rafael Antunes <me@rafaelgaspar.xyz>
 * Licensed under MPL 2.0, see:
 * http://www.mozilla.org/MPL/2.0/
 *
 * Run with: node --test tests/
 */

import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";
import {
  test
} from "node:test";

test("shadow/desktop sessions keep the toolbar window list", () => {
  const src = readFileSync(new URL("../html5/js/Client.js", import.meta.url), "utf8");
  const start = src.indexOf("_new_window(");
  const end = src.indexOf("_new_window_common(");
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const fn = src.slice(start, end);
  assert.doesNotMatch(fn, /noWindowList/);
  assert.match(fn, /!win\.tray && !win\.override_redirect/);
});

test("lost windows remove list items with the same filter", () => {
  const src = readFileSync(new URL("../html5/js/Client.js", import.meta.url), "utf8");
  const start = src.indexOf("_process_lost_window(");
  const end = src.indexOf("on_last_window()", start);
  assert.notEqual(start, -1);
  const fn = src.slice(start, end === -1 ? undefined : end);
  assert.match(fn, /removeWindowListItem/);
  assert.match(fn, /!win\.tray && !win\.override_redirect/);
});
