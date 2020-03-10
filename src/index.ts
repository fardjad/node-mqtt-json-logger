import "source-map-support";

import { parseAndValidateArgs, showUsage } from "./cli";
import recoverable from "./utils/recoverable";
import { isDevelopment } from "./config/node-env";
import ErrorCodeWithExitCode from "./utils/error-code-with-exit-code";
import { readAndValidateConfig } from "./config/config-loader";
import logger from "./utils/logger";
import RotatingLogWriter from "./utils/rotating-log-writer";
import Broker from "./broker/kafka-broker";

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

  const broker = new Broker();

  const exitHandler = recoverable(() => async () => {
    await broker.disconnect();
    await Promise.all(logWriters.map(logWriter => logWriter.close()));

    logger.info("Bye!");
  });

  process.on("SIGINT", () => {
    exitHandler().then(() => process.exit(0));
  });

  process.on("beforeExit", exitHandler);

  config.topics.forEach(
    async ({ topic: pattern, path, compress, interval, maxFiles, size }) => {
      const rotatingLogWriter = new RotatingLogWriter(path, {
        compress,
        interval,
        maxFiles,
        size
      });

      logWriters.push(rotatingLogWriter);

      broker.on(
        "message",
        recoverable(defer => async (topic, payload, commit) => {
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

          defer(() => {
            commit();
          });

          if (!new RegExp(pattern).test(topic)) {
            return;
          }

          const message = {
            pattern,
            topic,
            receiveTimestamp: Date.now(),
            payload: JSON.parse(payloadString)
          };

          await rotatingLogWriter.write(message);
        })
      );
    }
  );

  await broker.connect(
    {
      groupId: config.broker.groupId,
      autoCommit: true,
      connectOnReady: true,
      fromOffset: "earliest",
      kafkaHost: config.broker.kafkaHost
    },
    config.topics.map(topic => {
      return {
        topic: topic.topic
      };
    })
  );
});

main();
