export const NODE_ENV = process.env.NODE_ENV || "development";

export const isProduction = () => {
  return NODE_ENV.toLowerCase() === "production";
};

export const isDevelopment = () => {
  return NODE_ENV.toLowerCase() === "development";
};

export const isTest = () => {
  return NODE_ENV.toLowerCase() === "test";
};
