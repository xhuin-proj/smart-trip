// next.config.js
const { loadEnvConfig } = require("@next/env");
if (process.env.NODE_ENV !== "production") {
  loadEnvConfig("../");
}
const nextConfig = {
  output: "standalone",
  reactCompiler: true,
  turbopack: { root: __dirname },
};
module.exports = nextConfig;
