type BrokerConfig = {
  url: string;
  clientId?: string;
  username?: string;
  password?: string;
  clean?: boolean;
};

type TopicSettings = {
  topic: string;
  path: string;
  qos: 0 | 1 | 2;
  size?: string;
  interval?: string;
  maxFiles?: number;
  compress?: "gzip";
};

export type Config = {
  broker: BrokerConfig;
  topics: TopicSettings[];
};
