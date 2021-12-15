module.exports = function (plop) {
  plop.setGenerator('list page generator', {
    description: 'this is a skeleton plopfile',
    prompts: [{
      type: 'input',
      name: 'pageName',
      message: '请输入页面名：',
      // default: 'Button',
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
        path: 'src/plop/{{pageName}}-manage/index.vue',
        templateFile: 'plop-templates/list/list.hbs'
      },
      {
        type: 'add',
        path: 'src/plop/{{pageName}}-manage/index.scss',
        templateFile: 'plop-templates/list/scss.hbs'
      },
    ]
  })
}