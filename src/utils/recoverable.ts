type AnyFn = (...args: any[]) => any;
type RecoverFunction = () => Error | undefined;
type DeferredFunction = (recover: RecoverFunction) => void;
type DeferFunction = (deferredFunction: DeferredFunction) => void;
type RecoverableCallback<Fn extends AnyFn> = (defer: DeferFunction) => Fn;

export class UnrecoveredExceptionsError extends Error {
  private _errors: Error[];

  public get errors(): Error[] {
    return this._errors;
  }

  constructor(message: string, errors: Error[]) {
    super(message);

    this._errors = errors;
  }

  public toString(): string {
    return `UnrecoveredExceptionsError: [${this.errors.join(",")}]`;
  }
}

const recoverable = <Fn extends AnyFn>(cb: RecoverableCallback<Fn>) => {
  const deferredFns: DeferredFunction[] = [];
  let errors: Error[] = [];

  const defer = (deferredFn: DeferredFunction) => {
    deferredFns.push(deferredFn);
  };

  const recover: RecoverFunction = () => {
    return errors.pop();
  };

  return async (...args: Parameters<Fn>) => {
    try {
      return (await cb(defer)(...args)) as ReturnType<Fn>;
    } catch (ex) {
      errors.push(ex);
    } finally {
      const callNextDeferredFn = async (): Promise<void> => {
        const currentDeferredFn = deferredFns.pop();
        if (currentDeferredFn == null) return;
        try {
          await Promise.resolve(currentDeferredFn(recover));
        } catch (ex) {
          errors.push(ex);
        }
        return await callNextDeferredFn();
      };

      await callNextDeferredFn();
      if (errors.length > 0) {
        throw new UnrecoveredExceptionsError("Unhandled exceptions!", errors);
      }
    }
  };
};

export default recoverable;
