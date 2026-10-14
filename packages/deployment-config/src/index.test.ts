import { describe, expect, it } from "vitest";
import { parseDocksideToml } from ".";

describe("parseDocksideToml", () => {
  it("defaults on missing or blank input", () => {
    expect(parseDocksideToml(null)).toEqual({ publish: ".", warnings: [] });
    expect(parseDocksideToml("   \n ")).toEqual({ publish: ".", warnings: [] });
  });

  it("defaults publish when absent, keeps warnings empty", () => {
    expect(parseDocksideToml("# just a comment\n")).toEqual({ publish: ".", warnings: [] });
  });

  it("reads a plain publish dir", () => {
    expect(parseDocksideToml('publish = "dist"')).toEqual({ publish: "dist", warnings: [] });
  });

  it("normalizes slashes and dots", () => {
    expect(parseDocksideToml('publish = "dist/"').publish).toBe("dist");
    expect(parseDocksideToml('publish = "./dist"').publish).toBe("dist");
    expect(parseDocksideToml('publish = "."').publish).toBe(".");
  });

  it("warns and ignores unknown keys", () => {
    const out = parseDocksideToml('publish = "dist"\nfoo = 1\nbar = "x"');
    expect(out.publish).toBe("dist");
    expect(out.warnings).toEqual(['unknown key "foo" ignored', 'unknown key "bar" ignored']);
  });

  it("rejects escapes", () => {
    expect(() => parseDocksideToml('publish = "/abs"')).toThrow("must stay inside");
    expect(() => parseDocksideToml('publish = "../evil"')).toThrow("must stay inside");
    expect(() => parseDocksideToml('publish = "a/../../b"')).toThrow("must stay inside");
  });

  it("rejects non-string and empty publish", () => {
    expect(() => parseDocksideToml("publish = 42")).toThrow("non-empty string");
    expect(() => parseDocksideToml('publish = ""')).toThrow("non-empty string");
    expect(() => parseDocksideToml('publish = "   "')).toThrow("non-empty string");
  });

  it("throws log-friendly errors on bad TOML", () => {
    expect(() => parseDocksideToml("publish = [unclosed")).toThrow("invalid dockside.toml");
  });
});
