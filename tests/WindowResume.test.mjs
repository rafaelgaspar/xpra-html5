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
import vm from "node:vm";

function load_window() {
  const context = vm.createContext({
    window: {},
    console,
  });
  const source = readFileSync(new URL("../html5/js/Window.js", import.meta.url), "utf8");
  vm.runInContext(`${source}\nthis.XpraWindow = XpraWindow;`, context);
  return context.XpraWindow;
}

test("resume keeps the existing canvas instead of replacing it", () => {
  const XpraWindow = load_window();
  const win = Object.create(XpraWindow.prototype);
  const canvas = {};
  win.canvas = canvas;
  let replaced = false;
  win.init_canvas = () => {
    replaced = true;
  };
  win.resume();
  assert.equal(replaced, false);
  assert.equal(win.canvas, canvas);
});
