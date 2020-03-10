import { EventEmitter } from "ee-ts";
import { ConsumerGroup, ConsumerGroupOptions } from "kafka-node";

import Broker, { BrokerEvents, TopicSubscription } from "./broker";
import Before from "../utils/before";
import logger from "../utils/logger";

export default class KafkaBroker extends EventEmitter<BrokerEvents>
  implements Broker<ConsumerGroup, ConsumerGroupOptions, undefined> {
  private consumerGroup?: ConsumerGroup;

  private validateConnection() {
    // https://github.com/SOHU-Co/kafka-node/blob/master/lib/kafkaClient.js#L169
    // ready field is not defined in type definitions
    if (!(this.consumerGroup?.client as any)?.ready) {
      throw new Error("Kafka client is not ready!");
    }
  }

  constructor() {
    super();
  }

  async connect(
    options: ConsumerGroupOptions,
    subscriptions: TopicSubscription<undefined>[]
  ) {
    this.consumerGroup = new ConsumerGroup(
      options,
      subscriptions.map(({ topic }) => topic)
    );

    await new Promise((resolve, reject) => {
      this.consumerGroup?.client.once("ready", resolve);
      this.consumerGroup?.client.once("error", reject);
    });

    logger.info(
      `Connected to Kafka broker: ${options.kafkaHost} with group ID of ${options.groupId}`
    );

    this.consumerGroup.on("message", message => {
      this.consumerGroup?.pause();
      this.emit(
        "message",
        message.topic,
        message.value.toString("utf-8"),
        () => {
          this.consumerGroup?.resume();
        }
      );
    });

    return this.consumerGroup;
  }

  @Before(KafkaBroker.prototype.validateConnection)
  disconnect() {
    return new Promise((resolve, reject) =>
      this.consumerGroup?.close((error: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      })
    ) as Promise<void>;
  }
}
