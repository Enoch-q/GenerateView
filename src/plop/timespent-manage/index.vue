<template>
  <div class="manage-container">
    <el-card>
      <!-- top row: search && add -->
      <search-add
        add-text="添加记录"
        :show-add="checkPermission(['superAdmin', 'admin', 'editor'])"
        @get-list="searchList"
        @show-dialog="showDialog"
      />
      <list-table ref="listTable" :config="tableConfig" />
    </el-card>

    <!-- add/edit dialog -->
    <el-dialog
      class="el-dialog-overflow"
      :title="`${addOperation ? '录入' : '编辑'}信息`"
      :visible.sync="dialogVisible"
      width="80%"
      :before-close="beforeCloseDialog"
      @close="closeDialogCb"
    >
      <edit-modal
        ref="editModal"
        :add-operation="addOperation"
        @closeDialog="closeDialog"
        @addOrUpdateList="addOrUpdateList"
      />
    </el-dialog>
  </div>
</template>

<script>
// component
import SearchAdd from '@/components/SearchAdd'
import EditModal from './components/EditModal.vue'
import ListTable from '@/components/ListTable'

// mixin
import initMetadata from '@/mixin/initMetadata'
import commonMixin from '@/mixin/common'

// api
import { addTimespent, deleteTimespent, updateTimespent } from '@/api/timespent'

// config
import Config from '@/utils/config'

// methods
import { confirmOperation } from '@/utils/common'

import { getTableConfig } from './config'
export default {
  name: 'Timespent',
  components: {
    'search-add': SearchAdd,
    'edit-modal': EditModal,
    'list-table': ListTable
  },
  mixins: [initMetadata, commonMixin],
  data() {
    return {
      // dialog: 对话框是否展示
      dialogVisible: false,
      // dialog: true-添加操作  false-编辑操作
      addOperation: false,
      tableConfig: null
    }
  },
  async created() {
    this.tableConfig = getTableConfig(
      (row) => {
        this.showDialog(false, row)
      },
      (row) => {
        this.removeByCode(row.timespent_code)
      }
    )
    if (!this.metadata) {
      // 如果元数据未初始化，则先获取元数据再获取设备故障信息
      await this.getMetaData()
    }
  },
  methods: {
    // 搜索按钮点击事件
    searchList(query) {
      this.$refs.listTable.getDataList(query)
    },
    // add / update List: 新增/编辑
    async addOrUpdateList(params, code) {
      const res = await (this.addOperation ? addTimespent(params) : updateTimespent(code, params))

      if (res && res.meta && res.meta.status === (this.addOperation ? Config.resStatus.CREATED : Config.resStatus.OK)) {
        this.$message.success(`${this.addOperation ? '添加' : '修改'}成功`)
        this.dialogVisible = false
        this.$refs.listTable.getDataList()
      } else {
        this.$message.error(res.meta.msg || `${this.addOperation ? '添加' : '修改'}失败`)
      }
    },
    // remove dialog: 打开删除对话框
    async removeByCode(code) {
      const confirmResult = await confirmOperation(this, `${code}`, '时间')

      if (confirmResult !== 'confirm') {
        return this.$message.info('已取消删除')
      } else {
        const res = await deleteTimespent(code)

        if (res && res.meta && res.meta.status === Config.resStatus.DELETED) {
          this.$message.success('删除成功')
        } else {
          return this.$message.error(res.meta.msg || '删除失败')
        }
      }

      this.$refs.listTable.getDataList()
    },

    // dialog: 打开对话框
    async showDialog(type = true, item) {
      this.addOperation = type
      this.dialogVisible = true

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
      if (!this.isFormEmpty(this.$refs.editModal.editForm)) {
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
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>

