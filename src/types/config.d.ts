type BrokerConfig = {
  kafkaHost: string;
  groupId: string;
};

type TopicSettings = {
  topic: string;
  path: string;
  size?: string;
  interval?: string;
  maxFiles?: number;
  compress?: "gzip";
};

export type Config = {
  broker: BrokerConfig;
  topics: TopicSettings[];
};
