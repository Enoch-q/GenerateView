module.exports = {
  description: 'list page generator',
  prompts: [{
    type: 'input',
    name: 'pageName',
    message: '请输入页面名：',
    // default: 'page',
    validate: value => {
      if(!value) {
        return '页面名必填';
      }
      return true
    },
  }],
  actions: [
    {
      type: 'add',
      path: '../src/plop/{{pageName}}-manage/index.vue',
      templateFile: '../plop-templates/list/list.hbs'
    },
    {
      type: 'add',
      path: '../src/plop/{{pageName}}-manage/index.scss',
      templateFile: '../plop-templates/list/scss.hbs'
    }
  ]
}