const path = require("node:path");

// The app's own react-native, wherever the install put it, so wall-ui's sources load the same copy.
const reactNative = path.dirname(
  require.resolve("react-native/package.json", { paths: [__dirname] }),
);

/** @type {import("jest").Config} */
module.exports = {
  preset: "react-native",
  testRegex: "/src/.*\\.test\\.(ts|tsx)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  roots: ["<rootDir>/src/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-native$": reactNative,
    "^react-native/(.*)$": `${reactNative}/$1`,
  },
};
