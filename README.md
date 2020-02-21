# MQTT JSON Logger

> MQTT JSON message logger with rotation support

## Features

- [x] Ignores non-JSON messages
- [x] Logs messages in [JSON Lines][2] format
- [x] Supports log rotation and compression

## Install

TBD

## Usage

mqtt-json-logger -c '/path/to/config-file.toml'

## Configuration File

```toml
[broker]
url = "tcp://broker"
clientId = "mqtt-json-logger"
username = "username"
password = "password"

[[topics]]
topic = "topic1/#"
path = "topic1.log"
size = "1G"
interval = "1d"
maxFiles = 14
compress = "gzip"
qos = 2

[[topics]]
topic = "topic2/#"
path = "topic2.log"
```

[1]: https://github.com/mqttjs
[2]: http://jsonlines.org/
