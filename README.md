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

The config file schema is defined in [`src/config/config-schema.json`](src/config/config-schema.json)

```toml
[broker]
# MQTT broker URL
url = "tcp://broker"

# Optional properties
clientId = "mqtt-json-logger"
username = "username"
password = "password"
# Set to false to receive QoS 1 and 2 messages while offline. Defaults to true
clean = true

[[topics]]
# Topic to subscribe to
topic = "topic1/#"
# Path to store the log files
path = "topic1.log"

qos = 2 # Defaults to 1

# The file size to rotate the file. Defaults to null
size = "1G"
# Time interval to rotate the file. Defaults to null
interval = "1d"
# Maximum number of rotated files to keep. Defaults to null
maxFiles = 14
# Enable compression
compress = "gzip"

[[topics]]
topic = "topic2/#"
path = "topic2.log"
```

[1]: https://github.com/mqttjs
[2]: http://jsonlines.org/
