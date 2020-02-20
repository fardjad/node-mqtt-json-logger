import logger from "./utils/logger";
import { isDevelopment } from "./config/node-env";

const enableLongStackTraces = async () => {
  Error.stackTraceLimit = Infinity;
  const longjohn = await import("longjohn");
  longjohn.async_trace_limit = -1;

  logger.info("Long stack traces are enabled");
};

const main = async () => {
  if (isDevelopment()) {
    await enableLongStackTraces();
  }
};

main();
