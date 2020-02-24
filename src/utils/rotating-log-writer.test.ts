import { resolve, join, dirname } from "path";
import { createGenerator } from "./rotating-log-writer";

describe("A RotatingLogWriter", () => {
  describe("For absolute paths", () => {
    const absolutePath = resolve(join(__dirname, "../../test.log"));
    it(`like ${absolutePath}, will generate the correct rotated filename`, () => {
      const generatedPath = createGenerator(absolutePath, "gzip")(
        new Date(),
        1
      );
      expect(dirname(generatedPath)).toEqual(dirname(absolutePath));
    });
  });

  describe("For relative paths", () => {
    const relativePath = "./test.log";
    it(`like ${relativePath}, will generate the correct rotated filename`, () => {
      const generatedPath = createGenerator(relativePath, "gzip")(
        new Date(),
        1
      );
      expect(dirname(generatedPath)).toEqual(dirname(relativePath));
    });
  });
});
