# Kafka JSON Logger

> Kafka JSON message logger with rotation support

## Features

- [x] Ignores non-JSON messages
- [x] Logs messages in [JSON Lines][1] format
- [x] Supports log rotation and compression

## Install

TBD

## Usage

    kafka-json-logger -c '/path/to/config-file.toml'

## Configuration File

The config file schema is defined in [`src/config/config-schema.json`](src/config/config-schema.json)

[1]: http://jsonlines.org/
