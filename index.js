/* eslint-disable import/no-unresolved */

// Temporarily forcing development build for easier debugging
// if (process.env.NODE_ENV === "production") {
//   module.exports = require("./lib/react-input-mask.production.min");
// } else {
const lib = require('./lib/react-input-mask.development');

module.exports = lib;
module.exports.default = lib.default || lib;
// }
