
<template>
  <div class="manage-container rode-container">
    <el-card>
      <!-- top row: search rode && add rode -->
      <search-add
        add-text="添加"
        :show-add="checkPermission(['superAdmin', 'admin', 'editor'])"
        @get-list="searchList"
        @show-dialog="showDialog"
      />

      <!-- middle row: rode list -->
      <el-table
        :data="currentRodeList"
        class="item-list rode-list"
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
        <el-table-column prop="rode_code" label="所属编号" min-width="160px" sortable="custom" />
        <el-table-column prop="project_name" label="所属项目" min-width="120px" sortable="custom" />
        <el-table-column prop="task_name" label="所属任务" min-width="120px" sortable="custom" />
        <el-table-column prop="vehicle_name" label="所属车辆" min-width="120px" sortable="custom" />
        <el-table-column prop="rode_records" label="记录" min-width="120px" sortable="custom">
          <template v-slot="slotProps">
            <span>
              {{ slotProps.row.rode_records }}
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
                @click="removeByCode(slotProps.row.rode_code)"
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
        :total="rodeTotal"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- add/edit rode dialog -->
    <el-dialog
      class="el-dialog-overflow"
      :title="getTitle(addOperation)"
      :visible.sync="rodeDialogVisible"
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
import { addRode, deleteRode, updateRode } from '@/api/rode'

// config
import Config from '@/utils/config'

// methods
import { confirmOperation } from '@/utils/common'
import {
  u_getRodeList
} from '@/utils/data-get'

import { getRode } from './utils'

export default {
  name: 'Rode',
  components: {
    'search-add': SearchAdd
  },
  mixins: [initMetadata, commonMixin],
  data() {
    return {
      // rode list module: 获取列表的请求参数
      queryInfo: { query: '', pagenum: 1, pagesize: 10 },
      // rode list module: 总量
      rodeTotal: 0,
      // rode list module: 列表
      rodeList: [],
      rodeTypeList: [],
      // rode list module: 当前列表
      currentRodeList: [],
      // dialog: 对话框是否展示
      rodeDialogVisible: false,
      // dialog: true-添加操作  false-编辑操作
      addOperation: false
    }
  },
  watch: {
    rodeTotal: {
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

    this.rodeTypeList = this.metadata.time_options.list
  },
  methods: {
    // 获取列表
    async getDataList(initial = false) {
      this.rodeList = await u_getRodeList()
      // 排序
      if (this.sort) {
        this.rodeList = this.sortResult(this.sort.order, this.rodeList, this.sort.prop)
      }

      const { list, total } = this.pagination(
        this.rodeList,
        ['rode_code', 'project_name', 'task_name', 'vehicle_name', 'rode_records'],
        this.queryInfo,
        initial
      )

      this.currentRodeList = list
      this.rodeTotal = total
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
      const res = await (this.addOperation ? addRode(params) : updateRode(code, params))

      if (res && res.meta && res.meta.status === (this.addOperation ? Config.resStatus.CREATED : Config.resStatus.OK)) {
        this.$message.success(this.getTip(this.addOperation))
        this.rodeDialogVisible = false
        this.getDataList()
      } else {
        this.$message.error(res.meta.msg || this.getTip(this.addOperation, true))
      }
    },
    // remove dialog: 打开删除对话框
    async removeByCode(rode_code) {
      const confirmResult = await confirmOperation(this, rode_code, '时间')

      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      } else {
        const res = await deleteRode(rode_code)

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
      this.rodeDialogVisible = true

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
      if (!this.isFormEmpty(this.$refs.editModal.rodeForm)) {
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
      this.rodeDialogVisible = false
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
  
  
