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

class FakeWorker {
  constructor() {
    this.terminated = false;
    this.posted = [];
    FakeWorker.created.push(this);
  }
  addEventListener(_type, listener) {
    this.listener = listener;
  }
  postMessage(message) {
    this.posted.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply() {
    this.listener({
      data: {
        result: true,
        formats: ["h264"]
      }
    });
  }
}

function fake_client() {
  FakeWorker.created = [];
  const context = vm.createContext({
    window: {
      Worker: FakeWorker,
      createImageBitmap: () => {},
    },
    Worker: FakeWorker,
    XpraProtocolWorkerHost: class {},
    XpraOffscreenWorker: {
      isAvailable: () => true,
    },
    console,
  });
  const source = readFileSync(new URL("../html5/js/Client.js", import.meta.url), "utf8");
  vm.runInContext(`${source}\nthis.XpraClient = XpraClient;`, context);
  const client = Object.create(context.XpraClient.prototype);
  client.offscreen_api = true;
  client.ssl = true;
  client.id_to_window = {};
  client.check_encodings = [];
  client.clog = () => {};
  client.open_protocol = () => {};
  client.set_encoding_option = () => {};
  return client;
}

test("a reconnect discards a worker that is still starting", () => {
  const client = fake_client();
  client.initialize_workers();
  client.initialize_workers();
  const [first, second] = FakeWorker.created;
  assert.equal(first.terminated, true);
  assert.equal(second.terminated, false);
});

test("a late reply from an earlier worker does not replace the current one", () => {
  const client = fake_client();
  client.initialize_workers();
  client.initialize_workers();
  const [first, second] = FakeWorker.created;
  second.reply();
  assert.equal(client.decode_worker, second);
  first.reply();
  assert.equal(client.decode_worker, second);
});

test("removing windows stops both the current and the starting worker", () => {
  const client = fake_client();
  client.initialize_workers();
  const [current] = FakeWorker.created;
  current.reply();
  client.initialize_workers();
  const [, pending] = FakeWorker.created;
  client.remove_windows();
  assert.equal(current.terminated, true);
  assert.equal(pending.terminated, true);
  assert.equal(client.decode_worker, null);
  assert.equal(client.pending_decode_worker, null);
});
