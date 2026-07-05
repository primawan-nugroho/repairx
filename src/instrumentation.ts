export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { forceIpv4 } = await import("@/lib/force-ipv4");
    forceIpv4();
  }
}
