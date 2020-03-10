import {
  AsyncMqttClient,
  IClientOptions,
  connectAsync,
  IClientSubscribeOptions
} from "async-mqtt";
import { EventEmitter } from "ee-ts";

import Broker, { BrokerEvents, TopicSubscription } from "./broker";
import Before from "../utils/before";
import logger from "../utils/logger";

type IClientOptionsWithBrokerUrl = IClientOptions & { url: string };

export default class MQTTBroker extends EventEmitter<BrokerEvents>
  implements
    Broker<
      AsyncMqttClient,
      IClientOptionsWithBrokerUrl,
      IClientSubscribeOptions
    > {
  private client?: AsyncMqttClient;
  private subscribedTopics: string[] = [];

  private validateConnection() {
    if (this.client == null) {
      throw new Error("MQTT client is not connected!");
    }
  }

  constructor() {
    super();
  }

  async connect(
    options: IClientOptionsWithBrokerUrl,
    subscriptions: TopicSubscription<IClientSubscribeOptions>[]
  ) {
    this.client = await connectAsync(options.url, {
      ...options
    });

    logger.info(
      `Connected to MQTT broker: ${
        options.url
      } with cleanSession set to ${options.clean || true}`
    );

    for (let subscription of subscriptions) {
      const {
        topic,
        options: { qos }
      } = subscription;

      this.client
        .subscribe(topic, {
          qos
        })
        .then(() => {
          this.subscribedTopics.push(topic);
          logger.info(`Subscribed to topic: ${topic} with qos=${qos}`);
        })
        .catch(err => {
          logger.error({
            msg: `Could not subscribe to topic: ${topic}`,
            err
          });
        });
    }

    this.client.on("message", (topic, payload) => {
      this.emit("message", topic, payload.toString());
    });

    return this.client;
  }

  @Before(MQTTBroker.prototype.validateConnection)
  async disconnect() {
    this.client?.removeAllListeners();
    await this.client?.unsubscribe(this.subscribedTopics);
    this.subscribedTopics = [];
    await this.client!.end();
    this.client = undefined;
  }
}
