const getName = require('../../scripts/utils');

test('get upperCamelName and lowerCamelName', () => {
  expect(getName('manage')).toStrictEqual({
    upperCamelName: 'Manage',
    lowerCamelName: 'manage'
  })
  expect(getName('timespent-manage')).toStrictEqual({
    upperCamelName: 'TimespentManage',
    lowerCamelName: 'timespentManage'
  })
})