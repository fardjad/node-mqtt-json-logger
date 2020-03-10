const Before = <T extends (...args: any[]) => any>(fn: T) => {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const method = descriptor.value;
    descriptor.value = function(...args: any[]) {
      fn.call(this);
      return method?.apply(this, args);
    };
    return descriptor;
  };
};

export default Before;
