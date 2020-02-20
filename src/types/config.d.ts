type BrokerConfig = {
  url: string;
  clientId?: string;
  username?: string;
  password?: string;
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
