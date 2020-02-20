type BrokerConfig = {
  url: string;
  clientId?: string;
  username?: string;
  password?: string;
};

type TopicSettings = {
  topic: string;
  path: string;
};

export type Config = {
  broker: BrokerConfig;
  topics: TopicSettings[];
};
