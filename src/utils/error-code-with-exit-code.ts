export default class ErrorCodeWithExitCode extends Error {
  public readonly exitCode: number;

  constructor(message: string, exitCode: number = -1) {
    super(message);
    this.exitCode = exitCode;
  }
}
