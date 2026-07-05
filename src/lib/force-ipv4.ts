import dns from "node:dns";
import { Agent, setGlobalDispatcher } from "undici";

// This sandbox/host has broken outbound IPv6 routing (connections blackhole and
// time out instead of failing fast), which breaks both Node's net module and
// undici's fetch when they race IPv4/IPv6 addresses together. Force IPv4-only
// at both the dns and fetch-dispatcher level so Neon (HTTP + websocket) is reachable.
let applied = false;

export function forceIpv4() {
  if (applied) return;
  applied = true;
  dns.setDefaultResultOrder("ipv4first");
  setGlobalDispatcher(new Agent({ connect: { family: 4 } }));
}
