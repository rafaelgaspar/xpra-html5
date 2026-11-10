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

function load_client() {
  const context = vm.createContext({
    window: {},
    console,
  });
  const source = readFileSync(new URL("../html5/js/Client.js", import.meta.url), "utf8");
  vm.runInContext(`${source}\nthis.XpraClient = XpraClient;`, context);
  return context.XpraClient;
}

// just enough of a client to see whether a websocket error gives up:
function fake_client({
  connected,
  attempt
}) {
  const XpraClient = load_client();
  const client = Object.create(XpraClient.prototype);
  client.reconnect = true;
  client.reconnect_count = 5;
  client.reconnect_attempt = attempt;
  client.reconnect_in_progress = false;
  client.connected = connected;
  client.closed = 0;
  client.cerror = () => {};
  client.packet_disconnect_reason = () => {};
  client.close_audio = () => {};
  client.close = function() {
    this.closed += 1;
  };
  return client;
}

test("a websocket error before the first connection is retried within the budget", () => {
  // behind a proxy that is still leasing a screen, 1006 just means "not yet"
  const client = fake_client({
    connected: false,
    attempt: 2
  });
  client._process_error(["error", "closed before established", 1006]);
  assert.equal(client.closed, 0);
});

test("a websocket error before the first connection gives up once the budget is spent", () => {
  const client = fake_client({
    connected: false,
    attempt: 5
  });
  client._process_error(["error", "closed before established", 1006]);
  assert.equal(client.closed, 1);
});

test("a websocket error after connecting keeps reconnecting", () => {
  const client = fake_client({
    connected: true,
    attempt: 7
  });
  client._process_error(["error", "connection reset", 1006]);
  assert.equal(client.closed, 0);
});
