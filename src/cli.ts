import arg from "arg";
import ErrorCodeWithExitCode from "./utils/error-code-with-exit-code";

export class CommandLineArgsError extends ErrorCodeWithExitCode {}

export const showUsage = () => {
  console.log(
    [
      "Usage: mqtt-json-logger [options]",
      "",
      "Options:",
      "  -h, --help\t\tOutput usage information",
      "  -c, --config\t\tPath to the config file"
    ].join("\n")
  );
};

export const parseAndValidateArgs = (argv: string[]) => {
  const options = arg(
    {
      "--help": Boolean,
      "--config": String,
      // aliases
      "-h": "--help",
      "-c": "--config"
    },
    {
      argv: argv.slice(2)
    }
  );

  if (options["--help"]) {
    return options;
  }

  if (!options["--config"]) {
    throw new CommandLineArgsError("Config file is not specified!");
  }

  return options;
};
