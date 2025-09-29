<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="模块名称" prop="moduleName">
        <el-input
          v-model="queryParams.moduleName"
          placeholder="请输入模块名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="配置项键名" prop="configKey">
        <el-input
          v-model="queryParams.configKey"
          placeholder="请输入配置项键名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="配置项值" prop="configValue">
        <el-input
          v-model="queryParams.configValue"
          placeholder="请输入配置项值"
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
          v-hasPermi="['kms:systemMetadata:add']"
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
          v-hasPermi="['kms:systemMetadata:edit']"
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
          v-hasPermi="['kms:systemMetadata:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['kms:systemMetadata:export']"
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
      :data="systemMetadataList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="自增主键" align="center" prop="id" />
      <el-table-column label="模块名称" align="center" prop="moduleName" />
      <el-table-column label="配置项键名" align="center" prop="configKey" />
      <el-table-column label="配置项值" align="center" prop="configValue" />
      <el-table-column label="配置备注" align="center" prop="remark" />
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
            v-hasPermi="['kms:systemMetadata:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['kms:systemMetadata:remove']"
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

    <!-- 添加或修改系统元数据对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form
        ref="systemMetadataRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="模块名称" prop="moduleName">
          <el-input v-model="form.moduleName" placeholder="请输入模块名称" />
        </el-form-item>
        <el-form-item label="配置项键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入配置项键名" />
        </el-form-item>
        <el-form-item label="配置项值" prop="configValue">
          <el-input v-model="form.configValue" placeholder="请输入配置项值" />
        </el-form-item>
        <el-form-item label="配置备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入配置备注" />
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

<script setup name="SystemMetadata">
import {
  listSystemMetadata,
  getSystemMetadata,
  delSystemMetadata,
  addSystemMetadata,
  updateSystemMetadata,
} from "@/api/kms/systemMetadata";

const { proxy } = getCurrentInstance();

const systemMetadataList = ref([]);
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
    moduleName: null,
    configKey: null,
    configValue: null,
  },
  rules: {
    moduleName: [
      { required: true, message: "模块名称不能为空", trigger: "blur" },
    ],
    configKey: [
      { required: true, message: "配置项键名不能为空", trigger: "blur" },
    ],
    configValue: [
      { required: true, message: "配置项值不能为空", trigger: "blur" },
    ],
    updateTime: [
      { required: true, message: "更新时间不能为空", trigger: "blur" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询系统元数据列表 */
function getList() {
  loading.value = true;
  listSystemMetadata(queryParams.value).then((response) => {
    systemMetadataList.value = response.rows;
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
    moduleName: null,
    configKey: null,
    configValue: null,
    updateTime: null,
    remark: null,
  };
  proxy.resetForm("systemMetadataRef");
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
  title.value = "添加系统元数据";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getSystemMetadata(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改系统元数据";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["systemMetadataRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateSystemMetadata(form.value).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addSystemMetadata(form.value).then((response) => {
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
    .confirm('是否确认删除系统元数据编号为"' + _ids + '"的数据项？')
    .then(function () {
      return delSystemMetadata(_ids);
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
    "kms/systemMetadata/export",
    {
      ...queryParams.value,
    },
    `systemMetadata_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
