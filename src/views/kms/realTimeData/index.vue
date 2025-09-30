<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="CPU使用率" prop="cpuUsage">
        <el-input
          v-model="queryParams.cpuUsage"
          placeholder="请输入CPU使用率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="内存使用率" prop="memUsage">
        <el-input
          v-model="queryParams.memUsage"
          placeholder="请输入内存使用率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="磁盘使用率" prop="diskUsage">
        <el-input
          v-model="queryParams.diskUsage"
          placeholder="请输入磁盘使用率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="采集时间" prop="collectTime">
        <el-date-picker
          clearable
          v-model="queryParams.collectTime"
          format="YYYY-MM-DD HH:mm:ss"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择采集时间"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="数据有效性" prop="isValid">
        <el-input
          v-model="queryParams.isValid"
          placeholder="请输入数据有效性"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['kms:realTimeData:add']"
          >新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['kms:realTimeData:edit']"
          >修改</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['kms:realTimeData:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['kms:realTimeData:export']"
          >导出</el-button
        >
      </el-col>
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="realTimeDataList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="自增主键" align="center" prop="id" />
      <el-table-column label="CPU使用率" align="center" prop="cpuUsage" />
      <el-table-column label="内存使用率" align="center" prop="memUsage" />
      <el-table-column label="磁盘使用率" align="center" prop="diskUsage" />
      <el-table-column
        label="采集时间"
        align="center"
        prop="collectTime"
        width="180"
      >
        <template #default="scope">
          <span>{{ parseTime(scope.row.collectTime, "{y}-{m}-{d}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数据有效性" align="center" prop="isValid" />
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['kms:realTimeData:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['kms:realTimeData:remove']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog
      :title="title"
      v-model="open"
      width="500px"
      append-to-body
      align-center
    >
      <el-form
        ref="realTimeDataRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="CPU使用率" prop="cpuUsage">
          <el-input v-model="form.cpuUsage" placeholder="请输入CPU使用率" />
        </el-form-item>
        <el-form-item label="内存使用率" prop="memUsage">
          <el-input v-model="form.memUsage" placeholder="请输入内存使用率" />
        </el-form-item>
        <el-form-item label="磁盘使用率" prop="diskUsage">
          <el-input v-model="form.diskUsage" placeholder="请输入磁盘使用率" />
        </el-form-item>
        <el-form-item label="采集时间" prop="collectTime">
          <el-date-picker
            clearable
            v-model="form.collectTime"
            format="YYYY-MM-DD HH:mm:ss"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择采集时间"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="数据有效性" prop="isValid">
          <el-input v-model="form.isValid" placeholder="请输入数据有效性" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RealTimeData">
import {
  listRealTimeData,
  getRealTimeData,
  delRealTimeData,
  addRealTimeData,
  updateRealTimeData,
} from "@/api/kms/realTimeData";
const { proxy } = getCurrentInstance();

const realTimeDataList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    cpuUsage: null,
    memUsage: null,
    diskUsage: null,
    collectTime: null,
    isValid: null,
  },
  rules: {
    cpuUsage: [
      { required: true, message: "CPU使用率不能为空", trigger: "blur" },
    ],
    memUsage: [
      { required: true, message: "内存使用率不能为空", trigger: "blur" },
    ],
    diskUsage: [
      { required: true, message: "磁盘使用率不能为空", trigger: "blur" },
    ],
    collectTime: [
      { required: true, message: "采集时间不能为空", trigger: "blur" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询关键指标实时数据列表 */
function getList() {
  loading.value = true;
  listRealTimeData(queryParams.value).then((response) => {
    realTimeDataList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    cpuUsage: null,
    memUsage: null,
    diskUsage: null,
    collectTime: null,
    isValid: null,
  };
  proxy.resetForm("realTimeDataRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加关键指标实时数据";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getRealTimeData(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改关键指标实时数据";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["realTimeDataRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateRealTimeData(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addRealTimeData(form.value).then((response) => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除关键指标实时数据编号为"' + _ids + '"的数据项？')
    .then(function () {
      return delRealTimeData(_ids);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "kms/realTimeData/export",
    {
      ...queryParams.value,
    },
    `realTimeData_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
