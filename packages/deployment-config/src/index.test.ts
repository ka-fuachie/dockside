import { describe, expect, it } from "vitest";
import { parseDeploymentConfig } from ".";

describe("parseDocksideToml", () => {
  it("defaults on missing or blank input", () => {
    expect(parseDeploymentConfig(null)).toEqual({ publish: ".", warnings: [] });
    expect(parseDeploymentConfig("   \n ")).toEqual({ publish: ".", warnings: [] });
  });

  it("defaults publish when absent, keeps warnings empty", () => {
    expect(parseDeploymentConfig("# just a comment\n")).toEqual({ publish: ".", warnings: [] });
  });

  it("reads a plain publish dir", () => {
    expect(parseDeploymentConfig('publish = "dist"')).toEqual({ publish: "dist", warnings: [] });
  });

  it("normalizes slashes and dots", () => {
    expect(parseDeploymentConfig('publish = "dist/"').publish).toBe("dist");
    expect(parseDeploymentConfig('publish = "./dist"').publish).toBe("dist");
    expect(parseDeploymentConfig('publish = "."').publish).toBe(".");
  });

  it("warns and ignores unknown keys", () => {
    const out = parseDeploymentConfig('publish = "dist"\nfoo = 1\nbar = "x"');
    expect(out.publish).toBe("dist");
    expect(out.warnings).toEqual(['unknown key "foo" ignored', 'unknown key "bar" ignored']);
  });

  it("rejects escapes", () => {
    expect(() => parseDeploymentConfig('publish = "/abs"')).toThrow("must stay inside");
    expect(() => parseDeploymentConfig('publish = "../evil"')).toThrow("must stay inside");
    expect(() => parseDeploymentConfig('publish = "a/../../b"')).toThrow("must stay inside");
  });

  it("rejects non-string and empty publish", () => {
    expect(() => parseDeploymentConfig("publish = 42")).toThrow("non-empty string");
    expect(() => parseDeploymentConfig('publish = ""')).toThrow("non-empty string");
    expect(() => parseDeploymentConfig('publish = "   "')).toThrow("non-empty string");
  });

  it("throws log-friendly errors on bad TOML", () => {
    expect(() => parseDeploymentConfig("publish = [unclosed")).toThrow("invalid dockside.toml");
  });
});
