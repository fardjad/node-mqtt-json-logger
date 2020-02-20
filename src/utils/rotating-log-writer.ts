import { createStream, RotatingFileStream } from "rotating-file-stream";

const createGenerator = (filename: string, compress?: string) => {
  const pad = (num: number): string => (num > 9 ? "" : "0") + num;

  return (time: Date, index?: number): string => {
    if (!time) return filename;

    const month = time.getFullYear() + "" + pad(time.getMonth() + 1);
    const day = pad(time.getDate());
    const hour = pad(time.getHours());
    const minute = pad(time.getMinutes());

    return `${month}${day}-${hour}${minute}-${pad(index!)}-${filename}${
      compress ? ".gz" : ""
    }`;
  };
};

export default class RotatingLogWriter {
  private readonly stream: RotatingFileStream;

  constructor(
    path: string,
    opts: {
      size?: string;
      interval?: string;
      maxFiles?: number;
      compress?: "gzip";
    }
  ) {
    // dirty hack to remove undefined properties from the object
    // rotating-file-stream doesn't like undefined fields
    const options = JSON.parse(JSON.stringify(opts));

    // to workaround rotating-file-stream type definitions issue
    const generator = createGenerator(path, opts.compress) as any;

    this.stream = createStream(generator, options);
  }

  write(message: Object): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.write(`${JSON.stringify(message)}\n`, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end(resolve);
    });
  }
}
