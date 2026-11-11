import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

describe("client source", () => {
  it("does not mention the Linear API key", () => {
    const files = walk(join(process.cwd(), "src")).filter((file) => {
      if (file.endsWith(".test.ts")) return false;
      return file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".css");
    });
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source.includes("LINEAR_API_KEY"), file).toBe(false);
      expect(source.includes("lin_api_"), file).toBe(false);
    }
  });
});
