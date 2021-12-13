// template.js
const getName = require('../utils');

module.exports = {
  vueTemplate: componentName => {
    const { upperCamelName, lowerCamelName, underscoreName } = getName(componentName);
    return `
<template>
  <div class="manage-container ${componentName}-container">
    <el-card>
      <!-- top row: search ${componentName} && add ${componentName} -->
      <search-add
        add-text="添加"
        :show-add="checkPermission(['superAdmin', 'admin', 'editor'])"
        @get-list="searchList"
        @show-dialog="showDialog"
      />

      <!-- middle row: ${componentName} list -->
      <el-table
        :data="current${upperCamelName}List"
        class="item-list ${componentName}-list"
        stripe
        border
        max-height="calc(100vh - 236px)"
        highlight-current-row
        :cell-style="getCellStyle"
        @sort-change="sortChange"
        @row-dblclick="
          v => (checkPermission(['superAdmin', 'admin', 'editor']) ? showDialog(false, v) : '')
        "
      >
        <el-table-column prop="${underscoreName}_code" label="所属编号" min-width="160px" sortable="custom" />
        <el-table-column prop="project_name" label="所属项目" min-width="120px" sortable="custom" />
        <el-table-column prop="task_name" label="所属任务" min-width="120px" sortable="custom" />
        <el-table-column prop="vehicle_name" label="所属车辆" min-width="120px" sortable="custom" />
        <el-table-column prop="${underscoreName}_records" label="记录" min-width="120px" sortable="custom">
          <template v-slot="slotProps">
            <span>
              {{ slotProps.row.${underscoreName}_records }}
            </span>
          </template>
        </el-table-column>
        <el-table-column v-if="checkPermission(['superAdmin', 'admin', 'editor'])" label="操作" width="120px">
          <template v-slot="slotProps">
            <el-tooltip effect="dark" content="修改" placement="top" :enterable="false">
              <el-button
                type="primary"
                icon="el-icon-edit"
                size="mini"
                @click="showDialog(false, slotProps.row)"
              />
            </el-tooltip>
            <el-tooltip effect="dark" content="删除" placement="top" :enterable="false">
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                @click="removeByCode(slotProps.row.${underscoreName}_code)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- bottom row: pagination -->
      <el-pagination
        background
        :current-page="queryInfo.pagenum"
        :page-size="queryInfo.pagesize"
        :page-sizes="[10, 20, 50, 100, 1000000]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="${lowerCamelName}Total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- add/edit ${componentName} dialog -->
    <el-dialog
      class="el-dialog-overflow"
      :title="getTitle(addOperation)"
      :visible.sync="${lowerCamelName}DialogVisible"
      width="80%"
      :before-close="beforeCloseDialog"
      @close="closeDialogCb"
    >

    </el-dialog>
  </div>
</template>

<script>
// component
import SearchAdd from '@/components/SearchAdd'

// mixin
import initMetadata from '@/mixin/initMetadata'
import commonMixin from '@/mixin/common'

// api
import { add${upperCamelName}, delete${upperCamelName}, update${upperCamelName} } from '@/api/${componentName}'

// config
import Config from '@/utils/config'

// methods
import { confirmOperation } from '@/utils/common'
import {
  u_get${upperCamelName}List
} from '@/utils/data-get'

import { get${upperCamelName} } from './utils'

export default {
  name: '${upperCamelName}',
  components: {
    'search-add': SearchAdd
  },
  mixins: [initMetadata, commonMixin],
  data() {
    return {
      // ${componentName} list module: 获取列表的请求参数
      queryInfo: { query: '', pagenum: 1, pagesize: 10 },
      // ${componentName} list module: 总量
      ${lowerCamelName}Total: 0,
      // ${componentName} list module: 列表
      ${lowerCamelName}List: [],
      ${lowerCamelName}TypeList: [],
      // ${componentName} list module: 当前列表
      current${upperCamelName}List: [],
      // dialog: 对话框是否展示
      ${lowerCamelName}DialogVisible: false,
      // dialog: true-添加操作  false-编辑操作
      addOperation: false
    }
  },
  watch: {
    ${lowerCamelName}Total: {
      handler(val) {
        if (val > 0 && this.queryInfo.pagenum > 1 && val === (this.queryInfo.pagenum - 1) * this.queryInfo.pagesize) {
          this.queryInfo.pagenum -= 1
          this.getDataList()
        }
      }
    }
  },
  async created() {
    if (!this.metadata) {
      // 如果元数据未初始化，则先获取元数据再获取信息
      await this.getMetaData()
    }
    await this.getDataList()

    this.${lowerCamelName}TypeList = this.metadata.time_options.list
  },
  methods: {
    // 获取列表
    async getDataList(initial = false) {
      this.${lowerCamelName}List = await u_get${upperCamelName}List()
      // 排序
      if (this.sort) {
        this.${lowerCamelName}List = this.sortResult(this.sort.order, this.${lowerCamelName}List, this.sort.prop)
      }

      const { list, total } = this.pagination(
        this.${lowerCamelName}List,
        ['${underscoreName}_code', 'project_name', 'task_name', 'vehicle_name', '${underscoreName}_records'],
        this.queryInfo,
        initial
      )

      this.current${upperCamelName}List = list
      this.${lowerCamelName}Total = total
    },
    // 搜索按钮点击事件
    searchList(query) {
      const initial = (this.queryInfo.query !== query)
      this.queryInfo.query = query || ''
      this.getDataList(initial)
    },
    // 排序事件
    sortChange(sort) {
      this.sort = sort
      this.getDataList()
    },
    // pagination module: 页面变更事件
    handlePageChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getDataList()
    },
    // pagination module: 每页条数变更事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      this.getDataList()
    },

    // add / update List: 新增/编辑
    async addOrUpdateList(params, code) {
      const res = await (this.addOperation ? add${upperCamelName}(params) : update${upperCamelName}(code, params))

      if (res && res.meta && res.meta.status === (this.addOperation ? Config.resStatus.CREATED : Config.resStatus.OK)) {
        this.$message.success(this.getTip(this.addOperation))
        this.${lowerCamelName}DialogVisible = false
        this.getDataList()
      } else {
        this.$message.error(res.meta.msg || this.getTip(this.addOperation, true))
      }
    },
    // remove dialog: 打开删除对话框
    async removeByCode(${underscoreName}_code) {
      const confirmResult = await confirmOperation(this, ${underscoreName}_code, '时间')

      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      } else {
        const res = await delete${upperCamelName}(${underscoreName}_code)

        if (res && res.meta && res.meta.status === Config.resStatus.DELETED) {
          this.$message.success('删除成功')
        } else {
          return this.$message.error(res.meta.msg || '删除失败')
        }
      }

      this.getDataList()
    },

    // dialog: 打开对话框
    async showDialog(type = true, item) {
      this.addOperation = type
      this.${lowerCamelName}DialogVisible = true

      this.$nextTick(() => {
        if (this.addOperation) {
          this.$refs.editModal.InitAfterShowAddDialog()
        } else {
          this.$refs.editModal.InitAfterShowEditDialog(item)
        }
      })
    },
    // dialog: 关闭对话框之前事件
    beforeCloseDialog(done) {
      if (!this.isFormEmpty(this.$refs.editModal.${lowerCamelName}Form)) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done()
          })
          .catch(_ => {})
      } else {
        done()
      }
    },
    // dialog: 关闭对话框事件
    closeDialogCb() {
      this.resetTmp()
      this.$refs.editModal.restAftercloseDialog()
    },
    // dialog: 弹框关闭
    closeDialog() {
      this.${lowerCamelName}DialogVisible = false
    },
    getTitle(addOperation) {
      return (addOperation ? '录入' : '编辑') + '信息'
    },
    getTip(addOperation, fail = false) {
      return (addOperation ? '添加' : '修改') + (fail ? '失败' : '成功')
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
  
  
`
  }
}