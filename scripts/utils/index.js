function getUpperCameString(str) {
  return str.replace(str[0], str[0].toUpperCase())
}
function getName(componentName) {
  let upperCamelName='',lowerCamelName='';
  let arr = componentName.split('-')

  arr.forEach((i,k) => {
    upperCamelName += getUpperCameString(i)
    if(k === 0) {
      lowerCamelName = i;
      return
    }
    lowerCamelName += getUpperCameString(i)
  });

  return {
    upperCamelName,
    lowerCamelName,
    underscoreName: componentName.replace('-', '_')
  }
}
module.exports = getName