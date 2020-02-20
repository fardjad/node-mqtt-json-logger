import recoverable, { UnrecoveredExceptionsError } from "./recoverable";

const id = (x: any) => x;
const asyncId = (x: any) => Promise.resolve(x);

describe("Recoverable", () => {
  it("Should be able to wrap synchronous functions", async () => {
    expect(await recoverable(() => id)(1)).toBe(1);
  });

  it("Should be able to wrap asynchronous functions", async () => {
    expect(await recoverable(() => asyncId)(1)).toBe(1);
  });

  it("Should defer the execution of deferred functions to the end of the wrapped function", async () => {
    const mockFn = jest.fn();
    const result = await recoverable(defer => (x: any) => {
      defer(mockFn);
      return x;
    })(1);
    expect(result).toBe(1);
    expect(mockFn).toHaveBeenCalled();
  });

  it("Should call deferred functions in LIFO order", async () => {
    let value = 1;
    const result = await recoverable(defer => (x: any) => {
      defer(() => {
        value *= 10;
      });

      defer(() => {
        value += 2;
      });

      return x;
    })(1);
    expect(result).toBe(1);
    expect(value).toBe(30);
  });

  it("Should work with asynchronous deferred functions", async () => {
    const delay = (ms: number) =>
      new Promise((resolve, reject) => setTimeout(resolve, ms));

    const startTime = Date.now();
    const result = await recoverable(defer => (x: any) => {
      defer(() => {
        return delay(100);
      });

      defer(() => {
        return delay(100);
      });

      return x;
    })(1);
    const deltaTime = Date.now() - startTime;

    expect(result).toBe(1);
    expect(deltaTime).toBeGreaterThanOrEqual(100);
  });

  it("Should throw an error when there's at least one unrecovered error when recoverable() returns", () => {
    return recoverable(() => () => {
      throw new Error();
    })().catch(error => {
      expect(error).toBeInstanceOf(UnrecoveredExceptionsError);
    });
  });

  it("Should not throw an error when all errors are recovered", () => {
    const error = new Error();
    return recoverable(defer => () => {
      defer(recover => {
        expect(recover()).toEqual(error);
      });
      throw error;
    })();
  });

  it("Should stack errors thrown in deferred functions", () => {
    const error1 = new Error("1");
    const error2 = new Error("2");
    const error3 = new Error("3");

    return recoverable(defer => () => {
      defer(() => {
        throw error3;
      });

      defer(() => {
        throw error2;
      });

      throw error1;
    })().catch((error: UnrecoveredExceptionsError) => {
      expect(error.errors).toStrictEqual([error1, error2, error3]);
    });
  });
});
