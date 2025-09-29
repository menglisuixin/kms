<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="auto"
    >
      <!-- <el-form-item label="关联实时数据ID" prop="dataId">
        <el-input
          label-width="120"
          v-model="queryParams.dataId"
          placeholder="请输入关联实时数据ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item> -->
      <el-form-item label="预警级别" prop="warningLevel">
        <el-input
          v-model="queryParams.warningLevel"
          placeholder="请输入预警级别"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="分析时间" prop="analysisTime">
        <el-date-picker
          clearable
          v-model="queryParams.analysisTime"
          format="YYYY-MM-DD HH:mm:ss"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择分析时间"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="处理状态" prop="isHandled">
        <el-select
          v-model="queryParams.isHandled"
          placeholder="请选择处理状态"
          clearable
          @keyup.enter="handleQuery"
        >
          <el-option
            v-for="dict in kms_result_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
          v-hasPermi="['kms:analysisResult:add']"
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
          v-hasPermi="['kms:analysisResult:edit']"
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
          v-hasPermi="['kms:analysisResult:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['kms:analysisResult:export']"
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
      :data="analysisResultList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" width="60"/>
      <el-table-column label="预警类型" align="center" prop="warningType" />
      <el-table-column label="预警级别" align="center" prop="warningLevel" />
      <el-table-column
        label="分析时间"
        align="center"
        prop="analysisTime"
        width="180"
      >
        <template #default="scope">
          <span>{{
            parseTime(scope.row.analysisTime, "{y}-{m}-{d} {h}:{m}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="处理状态" align="center" prop="isHandled">
        <template #default="scope">
          <el-tag
            :type="scope.row.isHandled === 0 ? 'danger' : 'success'"
            size="medium"
            >{{ scope.row.isHandled === 0 ? "未处理" : "已处理" }}</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            @click="handleWarning(row)"
            :disabled="row.isHandled === 1"
          >
            {{ row.isHandled === 1 ? "已处理" : "处理" }}
          </el-button>
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

    <!-- 添加或修改预警结果，关联实时数据，主删除从同步删除对话框 -->
    <el-dialog
      :title="title"
      v-model="open"
      width="600px"
      append-to-body
      style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin: 0 !important;
      "
    >
      <el-form
        ref="analysisResultRef"
        :model="form"
        :rules="rules"
        label-width="120"
        label-position="right"
      >
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联实时数据ID" prop="dataId">
              <el-input
                v-model="form.dataId"
                placeholder="请输入关联实时数据ID"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警级别" prop="warningLevel">
              <el-input
                v-model="form.warningLevel"
                placeholder="请输入预警级别"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="分析时间" prop="analysisTime">
              <el-date-picker
                clearable
                v-model="form.analysisTime"
                format="YYYY-MM-DD HH:mm:ss"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择分析时间"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处理状态" prop="isHandled">
              <el-select
                v-model="form.isHandled"
                placeholder="请选择处理状态"
                clearable
              >
                <el-option
                  v-for="dict in kms_result_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="预警类型" prop="warningType">
              <el-input
                v-model="form.warningType"
                placeholder="请输入预警类型"
              />
            </el-form-item>
          </el-col>
        </el-row>
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

<script setup name="AnalysisResult">
import {
  listAnalysisResult,
  getAnalysisResult,
  delAnalysisResult,
  addAnalysisResult,
  updateAnalysisResult,
  handleAnalysisResult,
} from "@/api/kms/analysisResult";

const { proxy } = getCurrentInstance();
const { kms_result_status } = proxy.useDict("kms_result_status");
const analysisResultList = ref([]);
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
    dataId: null,
    warningType: null,
    warningLevel: null,
    analysisTime: null,
    isHandled: null,
  },
  rules: {
    dataId: [
      { required: true, message: "关联实时数据ID不能为空", trigger: "blur" },
    ],
    warningType: [
      { required: true, message: "预警类型不能为空", trigger: "change" },
    ],
    warningLevel: [
      { required: true, message: "预警级别不能为空", trigger: "blur" },
    ],
    analysisTime: [
      { required: true, message: "分析时间不能为空", trigger: "blur" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询预警结果，关联实时数据，主删除从同步删除列表 */
function getList() {
  loading.value = true;
  listAnalysisResult(queryParams.value).then((response) => {
    analysisResultList.value = response.rows;
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
    dataId: null,
    warningType: null,
    warningLevel: null,
    analysisTime: null,
    isHandled: null,
  };
  proxy.resetForm("analysisResultRef");
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
  title.value = "新增";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getAnalysisResult(_id).then((response) => {
    form.value = response.data;
    // 字典值通常为字符串，回显时确保类型一致以便 el-select 根据 value 匹配 label
    if (form.value.isHandled !== null && form.value.isHandled !== undefined) {
      form.value.isHandled = "" + form.value.isHandled;
    }
    open.value = true;
    title.value = "修改";
  });
}

/** 处理预警（调用后端 /handle 接口将 isHandled 置为 1） */
function handleWarning(row) {
  const _id = row && row.id;
  if (!_id) return;
  proxy.$modal
    .confirm('是否确认将当前时刻该项预警标记为已处理？')
    .then(function () {
      return handleAnalysisResult({ id: _id });
    })
    .then(() => {
      proxy.$modal.msgSuccess("处理成功");
      getList();
    })
    .catch(() => {});
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["analysisResultRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        // 提交时将 isHandled 转为数字（后端使用 Integer）
        const payload = { ...form.value };
        if (
          payload.isHandled !== null &&
          payload.isHandled !== undefined &&
          payload.isHandled !== ""
        ) {
          payload.isHandled = Number(payload.isHandled);
        } else {
          payload.isHandled = null;
        }
        updateAnalysisResult(payload).then((response) => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        const payload = { ...form.value };
        if (
          payload.isHandled !== null &&
          payload.isHandled !== undefined &&
          payload.isHandled !== ""
        ) {
          payload.isHandled = Number(payload.isHandled);
        } else {
          payload.isHandled = null;
        }
        addAnalysisResult(payload).then((response) => {
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
    .confirm(
      '是否确认删除预警结果，关联实时数据，主删除从同步删除编号为"' +
        _ids +
        '"的数据项？'
    )
    .then(function () {
      return delAnalysisResult(_ids);
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
    "kms/analysisResult/export",
    {
      ...queryParams.value,
    },
    `analysisResult_${new Date().getTime()}.xlsx`
  );
}

getList();
</script>
<style scoped lang="scss"></style>
