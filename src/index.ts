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

  const logWriters: RotatingLogWriter[] = [];
  const mqttClient = await connectAsync(config.broker.url, {
    clean: config.broker.clean,
    clientId: config.broker.clientId,
    username: config.broker.username,
    password: config.broker.password
  });

  const exitHandler = recoverable(() => async () => {
    mqttClient.removeAllListeners();
    await mqttClient.unsubscribe(config.topics.map(({ topic }) => topic));
    await mqttClient.end();
    await Promise.all(logWriters.map(logWriter => logWriter.close()));

    logger.info("Bye!");
  });

  process.on("SIGINT", () => {
    exitHandler().then(() => process.exit(0));
  });

  process.on("beforeExit", exitHandler);

  logger.info(
    `Connected to MQTT broker: ${
      config.broker.url
    } with cleanSession set to ${config.broker.clean || true}`
  );

  config.topics.forEach(
    async ({
      topic: pattern,
      path,
      qos,
      compress,
      interval,
      maxFiles,
      size
    }) => {
      mqttClient
        .subscribe(pattern, {
          qos
        })
        .then(() => {
          logger.info(`Subscribed to topic: ${pattern} with qos=${qos}`);
        })
        .catch(err => {
          logger.error({
            msg: `Could not subscribe to topic: ${pattern}`,
            err
          });
        });

      const rotatingLogWriter = new RotatingLogWriter(path, {
        compress,
        interval,
        maxFiles,
        size
      });

      logWriters.push(rotatingLogWriter);

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
    }
  );
});

main();
