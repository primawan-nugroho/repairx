import { Style, Avatar } from "@dicebear/core";
import definition from "@dicebear/styles/micah.json" with { type: "json" };

const style = new Style(definition);

/** Deterministic per-user avatar SVG markup, seeded by username so the same person
 * always gets the same face. Generated server-side (small, pure computation) rather
 * than shipping the dicebear packages to the client bundle. */
export function generateAvatarSvg(seed: string): string {
  const avatar = new Avatar(style, { seed });
  return avatar.toString();
}
