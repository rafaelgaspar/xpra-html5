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

function load_protocol() {
  const context = vm.createContext({
    console,
    CONNECT_TIMEOUT: 15_000,
    Utilities: {
      obfuscateURL: (uri) => uri,
    },
    WebTransport: class {},
  });
  const source = readFileSync(new URL("../html5/js/WebTransport.js", import.meta.url), "utf8");
  vm.runInContext(`${source}\nthis.XpraWebTransportProtocol = XpraWebTransportProtocol;`, context);
  return new context.XpraWebTransportProtocol();
}

function attach_closed_dispatch(protocol, closed) {
  protocol.webtransport = {
    closed,
    close() {
      return Promise.resolve();
    },
  };
  protocol.webtransport.closed.then(() => {
    protocol._dispatch(["close", "transport closed"]);
  }).catch((e) => {
    protocol._dispatch(["close", "error", e.toString()]);
  });
}

test("intentional close does not dispatch close after the transport settles", async () => {
  const protocol = load_protocol();
  const packets = [];
  protocol.set_packet_handler((packet) => packets.push(packet));
  let settle;
  const closed = new Promise((resolve) => {
    settle = resolve;
  });
  attach_closed_dispatch(protocol, closed);
  protocol.close();
  settle();
  await closed;
  await Promise.resolve();
  assert.deepEqual(packets, []);
});

test("close() does not throw when WebTransport.close() returns undefined", () => {
  const protocol = load_protocol();
  protocol.set_packet_handler(() => {
    throw new Error("close must not dispatch");
  });
  protocol.webtransport = {
    closed: Promise.resolve(),
    close() {
      return undefined;
    },
  };
  protocol.writer = {
    close() {
      return undefined;
    },
  };
  protocol.close();
});

test("a remote transport close still dispatches close", async () => {
  const protocol = load_protocol();
  const packets = [];
  protocol.set_packet_handler((packet) => packets.push(packet));
  let settle;
  const closed = new Promise((resolve) => {
    settle = resolve;
  });
  attach_closed_dispatch(protocol, closed);
  settle();
  await closed;
  await Promise.resolve();
  assert.deepEqual(packets, [
    ["close", "transport closed"]
  ]);
});
