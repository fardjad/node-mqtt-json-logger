import "source-map-support";

import { connectAsync } from "async-mqtt";
import mqttPattern from "mqtt-pattern";

import { parseAndValidateArgs, showUsage } from "./cli";
import recoverable from "./utils/recoverable";
import { isDevelopment } from "./config/node-env";
import ErrorCodeWithExitCode from "./utils/error-code-with-exit-code";
import { readAndValidateConfig } from "./config/config-loader";
import logger from "./utils/logger";
import RotatingLogWriter from "./utils/rotating-log-writer";

const enableLongStackTraces = async () => {
  Error.stackTraceLimit = Infinity;
  const longjohn = await import("longjohn");
  longjohn.async_trace_limit = -1;
};

const main = recoverable(defer => async () => {
  defer(recover => {
    const err = recover();
    if (!err) {
      return;
    }

    console.error(String(err));

    if (err instanceof ErrorCodeWithExitCode) {
      process.exit(err.exitCode);
    }

    process.exit(-1);
  });

  if (isDevelopment()) {
    await enableLongStackTraces();
  }

  const args = parseAndValidateArgs(process.argv);
  if (args["--help"]) {
    showUsage();
    process.exit(0);
  }

  const configFilePath = args["--config"]!;
  const config = readAndValidateConfig(configFilePath);

  const mqttClient = await connectAsync(config.broker.url, {
    clean: false,
    clientId: config.broker.clientId,
    username: config.broker.username,
    password: config.broker.password
  });

  logger.info(`Connected to MQTT broker: ${config.broker.url}`);

  config.topics.forEach(async ({ topic: pattern, path }) => {
    await mqttClient.subscribe(pattern, {
      qos: 1
    });

    logger.info(`Subscribed to topic: ${pattern}`);

    const rotatingLogWriter = new RotatingLogWriter(path);

    mqttClient.on(
      "message",
      recoverable(defer => async (topic, payload) => {
        const payloadString = payload.toString();

        defer(recover => {
          const err = recover();

          if (!err) {
            return;
          }

          if (err instanceof SyntaxError) {
            logger.debug("Received invalid payload", { payloadString });
            return;
          }

          logger.error(`Cannot store the message!`, {
            topic,
            payloadString,
            err
          });
        });

        if (!mqttPattern.matches(pattern, topic)) {
          return;
        }

        const message = {
          pattern,
          topic,
          payload: JSON.parse(payloadString)
        };

        await rotatingLogWriter.write(message);
      })
    );
  });
});

main();
