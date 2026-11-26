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

function fake_wt_client({
  connected
}) {
  const XpraClient = load_client();
  const client = Object.create(XpraClient.prototype);
  client.reconnect = true;
  client.reconnect_count = 5;
  client.reconnect_attempt = 0;
  client.reconnect_in_progress = false;
  client.connected = connected;
  client.webtransport = true;
  client.disconnect_reason = "";
  client.reconnected = false;
  client.closed = 0;
  client.clog = () => {};
  client.cerror = () => {};
  client.close_audio = () => {};
  client.emit_connection_lost = () => {};
  client.close_protocol = () => {};
  client.close = function() {
    this.closed += 1;
  };
  client.do_reconnect = function() {
    this.reconnected = true;
  };
  return client;
}

test("WebTransport open failure returns to connect.html with the error", () => {
  const client = fake_wt_client({
    connected: false
  });
  client._process_error(["error", "WebTransportError", 0]);
  assert.equal(client.webtransport, true);
  assert.equal(client.reconnected, false);
  assert.equal(client.closed, 1);
  assert.equal(client.disconnect_reason, "WebTransport connection failed: WebTransportError");
});

test("WebTransport close before connect also returns to connect.html", () => {
  const client = fake_wt_client({
    connected: false
  });
  client._process_close(["close", "connection failed", "WebTransportError"]);
  assert.equal(client.webtransport, true);
  assert.equal(client.reconnected, false);
  assert.equal(client.closed, 1);
  assert.equal(client.disconnect_reason, "WebTransport connection failed: WebTransportError");
});

test("a drop after WebTransport connected keeps reconnecting", () => {
  const client = fake_wt_client({
    connected: true
  });
  client._process_close(["close", "transport closed"]);
  assert.equal(client.webtransport, true);
  assert.equal(client.reconnected, true);
  assert.equal(client.closed, 0);
});
