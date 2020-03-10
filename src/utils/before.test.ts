import Before from "./before";

describe("Before decorator", () => {
  describe("When applied to a class method", () => {
    it("Should call the passed function before the decorated method", () => {
      const hook = jest.fn();
      class Test {
        @Before(hook)
        doSomething() {}
      }

      const test = new Test();
      test.doSomething();
      expect(hook).toBeCalled();
    });

    it('Should call the passed function with "this" bound to the instance of the class', () => {
      class Test {
        private _value = 0;

        constructor(value: number) {
          this._value = value;
        }
        private plus10() {
          this._value += 10;
        }
        @Before(Test.prototype.plus10)
        public times2() {
          this._value *= 2;
        }
        get value() {
          return this._value;
        }
      }

      const test = new Test(0);
      test.times2();
      expect(test.value).toBe(20);
    });
  });
});
