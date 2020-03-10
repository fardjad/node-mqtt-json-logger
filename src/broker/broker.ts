import { EventEmitter } from "ee-ts";

export interface BrokerEvents {
  message(topic: string, payload: any, commit?: Function): void;
}

export type TopicSubscription<TopicSubscriptionOptions> = {
  topic: string;
  options?: TopicSubscriptionOptions;
};

export default interface Broker<
  BrokerClient,
  BrokerOptions,
  TopicSubscriptionOptions
> extends EventEmitter<BrokerEvents> {
  connect(
    options: BrokerOptions,
    subscriptions: TopicSubscription<TopicSubscriptionOptions>[]
  ): Promise<BrokerClient>;
  disconnect(): Promise<void>;
}
