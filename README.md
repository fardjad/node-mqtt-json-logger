# MQTT JSON Logger

> MQTT JSON message logger with rotation support

## Features

- Ignores non-JSON messages
- Logs messages in [JSON Lines][2] format
- Supports log rotation and compression

## Install

TBD

## Usage

mqtt-json-logger -c '/path/to/config-file.toml'

## Configuration File

    broker.url = "tcp://broker"
    broker.clientId = "mqtt-json-logger"
    broker.username = "username"
    broker.password = "password"

    [[topics]]
    topic="topic1/#"
    path="/var/log/mqtt-json-logger/topic1.log"

    [[topics]]
    topic="topic2/#"
    path="/var/log/mqtt-json-logger/topic2.log"

[1]: https://github.com/mqttjs
[2]: http://jsonlines.org/
