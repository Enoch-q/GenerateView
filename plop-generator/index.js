const listPageGenerator = require('./list-page-generator');

module.exports = function (plop) {
  plop.setGenerator('list page generator', listPageGenerator)
}