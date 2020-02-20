import fs from "fs";
import { parse } from "toml";
import Ajv from "ajv";

import { Config } from "types/config";
import ErrorCodeWithExitCode from "../utils/error-code-with-exit-code";
import configSchema from "./config-schema.json";

export class ConfigError extends ErrorCodeWithExitCode {
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    line?: number,
    column?: number,
    exitCode: number = -1
  ) {
    super(message, exitCode);

    this.line = line;
    this.column = column;
  }

  toString() {
    if (this.line && this.column) {
      return `${this.name} in line ${this.line}, column ${this.column}: ${this.message}`;
    }
    return `${this.name}: ${this.message}`;
  }
}

export const readAndValidateConfig = (path: string): Config => {
  if (!fs.existsSync(path)) {
    throw new ConfigError("Config file does not exist!");
  }

  const configFileContents = fs.readFileSync(path, { encoding: "utf-8" });

  let config: Config;
  try {
    // parse and validate the TOML
    config = parse(configFileContents);
  } catch (ex) {
    // toml error objects contain line and column properties
    throw new ConfigError(ex.message, ex.line, ex.column);
  }

  const ajv = new Ajv();
  if (!ajv.validate(configSchema, config)) {
    throw new ConfigError(`Invalid config file! ${ajv.errorsText()}`);
  }

  return config;
};
