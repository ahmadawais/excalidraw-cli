import { describe, it, expect } from "vitest";
import { REFERENCE } from "../src/lib/reference.js";

describe("reference", () => {
  it("contains color palette", () => {
    expect(REFERENCE).toContain("Color Palette");
    expect(REFERENCE).toContain("#4a9eed");
    expect(REFERENCE).toContain("#f59e0b");
  });

  it("contains element types", () => {
    expect(REFERENCE).toContain("Rectangle");
    expect(REFERENCE).toContain("Ellipse");
    expect(REFERENCE).toContain("Diamond");
    expect(REFERENCE).toContain("Arrow");
  });

  it("contains camera sizing info", () => {
    expect(REFERENCE).toContain("Camera");
    expect(REFERENCE).toContain("800");
    expect(REFERENCE).toContain("600");
    expect(REFERENCE).toContain("4:3");
  });

  it("contains dark mode info", () => {
    expect(REFERENCE).toContain("Dark Mode");
    expect(REFERENCE).toContain("#1e1e2e");
  });
});
