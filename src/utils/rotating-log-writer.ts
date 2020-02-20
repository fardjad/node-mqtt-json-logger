import { createStream, RotatingFileStream } from "rotating-file-stream";

const createGenerator = (filename: string) => {
  const pad = (num: number): string => (num > 9 ? "" : "0") + num;

  return (time: Date, index?: number): string => {
    if (!time) return filename;

    const month = time.getFullYear() + "" + pad(time.getMonth() + 1);
    const day = pad(time.getDate());
    const hour = pad(time.getHours());
    const minute = pad(time.getMinutes());

    return `${month}${day}-${hour}${minute}-${pad(index!)}-${filename}.gz`;
  };
};

export default class RotatingLogWriter {
  private readonly stream: RotatingFileStream;

  constructor(
    path: string,
    size?: string,
    interval?: string,
    compress?: string,
    maxFiles?: number
  ) {
    // dirty hack to remove undefined properties from the object
    // rotating-file-stream doesn't like undefined fields
    const options = JSON.parse(
      JSON.stringify({
        size,
        interval,
        compress,
        maxFiles
      })
    );

    // to workaround rotating-file-stream type definitions issue
    const generator = createGenerator(path) as any;

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
