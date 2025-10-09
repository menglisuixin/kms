<template>
  <div class="app-container">
    <!-- 搜索表单保持不变 -->
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="CPU总使用率" prop="cpuUsage">
        <el-input
          v-model="queryParams.cpuUsage"
          placeholder="请输入CPU总使用率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="内存总使用率" prop="memUsage">
        <el-input
          v-model="queryParams.memUsage"
          placeholder="请输入内存总使用率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="磁盘总使用率" prop="diskUsage">
        <el-input
          v-model="queryParams.diskUsage"
          placeholder="请输入磁盘总使用率"
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

    <!-- 扩展表格，显示更多系统指标列 -->
    <el-table
      v-loading="loading"
      :data="realTimeDataList"
      :span-method="mergeRowMethod"
      style="height: calc(100vh - 400px); overflow: auto"
    >
      <el-table-column label="序号" align="center" width="80">
        <template #default="scope">
          <span>{{ scope.row.serialNumber }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="CPU总使用率"
        align="center"
        prop="cpuUsage"
        width="120"
      >
        <template #default="scope">
          <span>{{ scope.row.cpuUsage }}%</span>
        </template>
      </el-table-column>
      <el-table-column
        label="CPU用户使用率"
        align="center"
        prop="cpuUserUsage"
        width="120"
      >
        <template #default="scope">
          <span>{{ scope.row.cpuUserUsage }}%</span>
        </template>
      </el-table-column>
      <el-table-column
        label="CPU系统使用率"
        align="center"
        prop="cpuSysUsage"
        width="120"
      >
        <template #default="scope">
          <span>{{ scope.row.cpuSysUsage }}%</span>
        </template>
      </el-table-column>
      <el-table-column
        label="CPU空闲率"
        align="center"
        prop="cpuIdleUsage"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.cpuIdleUsage }}%</span>
        </template>
      </el-table-column>
      <el-table-column
        label="内存总使用率"
        align="center"
        prop="memUsage"
        width="120"
      >
        <template #default="scope">
          <span>{{ scope.row.memUsage }}%</span>
        </template>
      </el-table-column>
      <el-table-column
        label="内存总量"
        align="center"
        prop="memTotal"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.memTotal }}GB</span>
        </template>
      </el-table-column>
      <el-table-column
        label="已用内存"
        align="center"
        prop="memUsed"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.memUsed }}GB</span>
        </template>
      </el-table-column>
      <el-table-column
        label="空闲内存"
        align="center"
        prop="memFree"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.memFree }}GB</span>
        </template>
      </el-table-column>
      <el-table-column
        label="磁盘路径"
        align="center"
        prop="diskPath"
        width="100"
      />
      <el-table-column
        label="磁盘总使用率"
        align="center"
        prop="diskUsage"
        width="120"
      >
        <template #default="scope">
          <span>{{ scope.row.diskUsage }}%</span>
        </template>
      </el-table-column>
      <el-table-column
        label="磁盘总量"
        align="center"
        prop="diskTotal"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.diskTotal }}GB</span>
        </template>
      </el-table-column>
      <el-table-column
        label="已用磁盘"
        align="center"
        prop="diskUsed"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.diskUsed }}GB</span>
        </template>
      </el-table-column>
      <el-table-column
        label="空闲磁盘"
        align="center"
        prop="diskFree"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.diskFree }}GB</span>
        </template>
      </el-table-column>
      <el-table-column
        label="磁盘类型"
        align="center"
        prop="diskType"
        width="100"
      />
      <el-table-column
        label="采集时间"
        align="center"
        prop="collectTime"
        width="180"
      >
        <template #default="scope">
          <span>{{
            parseTime(scope.row.collectTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="数据有效性"
        align="center"
        prop="isValid"
        width="100"
      >
        <template #default="scope">
          <span>{{ scope.row.isValid === 1 ? "有效" : "无效" }}</span>
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
  </div>
</template>

<script setup name="RealTimeData">
import { listRealTimeData } from "@/api/kms/realTimeData";
const { proxy } = getCurrentInstance();

const realTimeDataList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const title = ref("");
// 用于存储合并行的信息
const mergeRowRecord = ref({});
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10, // 恢复为标准默认值
    cpuUsage: null,
    memUsage: null,
    diskUsage: null,
    collectTime: null,
    isValid: null,
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询关键指标实时数据列表 */
function getList() {
  loading.value = true;
  listRealTimeData(queryParams.value).then((response) => {
    // 处理数据，解析diskData字段
    const processedData = processDataWithDiskInfo(response.rows);
    // 直接使用处理后的数据
    realTimeDataList.value = processedData;
    // 使用接口返回的总条数
    total.value = response.total;
    loading.value = false;
  });
}

/** 处理包含diskData字段的数据 */
function processDataWithDiskInfo(data) {
  if (!data || data.length === 0) return [];

  let result = [];

  data.forEach((item) => {
    try {
      // 解析diskData JSON字符串
      const diskData = JSON.parse(item.diskData || "[]");

      // 如果没有磁盘数据，创建一个空记录
      if (!diskData || diskData.length === 0) {
        result.push({
          ...item,
          diskPath: "",
          diskUsage: 0,
          diskTotal: 0,
          diskUsed: 0,
          diskFree: 0,
          diskType: "",
        });
      } else {
        // 为每个磁盘创建一条记录
        diskData.forEach((disk) => {
          result.push({
            ...item,
            diskPath: disk.path || "",
            diskUsage: disk.usage || 0,
            diskTotal: disk.total || 0,
            diskUsed: disk.used || 0,
            diskFree: disk.free || 0,
            diskType: disk.type || "",
          });
        });
      }
    } catch (error) {
      console.error("解析diskData失败:", error);
      // 出错时创建一条空记录
      result.push({
        ...item,
        diskPath: "",
        diskUsage: 0,
        diskTotal: 0,
        diskUsed: 0,
        diskFree: 0,
        diskType: "",
      });
    }
  });

  // 调用原有处理函数进行排序和添加序号
  return processDataForTable(result);
}

/** 处理表格数据，添加前端序号并准备合并行信息 */
function processDataForTable(data) {
  if (!data || data.length === 0) return [];

  // 按采集时间和磁盘路径排序
  data.sort((a, b) => {
    // 先按采集时间降序
    if (a.collectTime !== b.collectTime) {
      return new Date(b.collectTime) - new Date(a.collectTime);
    }
    // 再按磁盘路径升序(C→D→E...)
    return a.diskPath.localeCompare(b.diskPath);
  });

  // 重置合并行记录
  mergeRowRecord.value = {};

  // 为每组相同时间点的数据分配相同的序号
  // 计算当前页的起始序号（考虑分页）
  const startSerialNumber =
    (queryParams.value.pageNum - 1) * queryParams.value.pageSize + 1;
  let currentTimePointIndex = 0; // 当前时间点索引
  let lastCollectTime = null;

  data.forEach((item, index) => {
    if (index === 0 || item.collectTime !== lastCollectTime) {
      // 新的时间点，序号增加
      currentTimePointIndex++;
    }

    // 计算连续序号：起始序号 + 当前时间点索引 - 1
    item.serialNumber = startSerialNumber + currentTimePointIndex - 1;
    lastCollectTime = item.collectTime;
  });

  // 计算需要合并的行
  calculateMergeRows(data);

  return data;
}

/** 计算需要合并的行 */
function calculateMergeRows(data) {
  // 按采集时间分组
  const timeGroups = {};
  data.forEach((item, index) => {
    if (!timeGroups[item.collectTime]) {
      timeGroups[item.collectTime] = [];
    }
    timeGroups[item.collectTime].push(index);
  });

  // 对每组相同时间的数据记录合并信息
  Object.values(timeGroups).forEach((group) => {
    // 每组的第一行需要显示，其余行需要合并
    group.forEach((rowIndex, idx) => {
      // 对于CPU、内存等相同的列，第一行占多行，其余行不显示
      if (idx === 0) {
        mergeRowRecord.value[rowIndex] = {
          rowspan: group.length,
          colspan: 1,
        };
      } else {
        mergeRowRecord.value[rowIndex] = {
          rowspan: 0,
          colspan: 1,
        };
      }
    });
  });
}

/** 合并行的方法 */
function mergeRowMethod({ row, column, rowIndex, columnIndex }) {
  // 需要合并的列：序号、CPU相关、内存相关、采集时间、数据有效性
  const mergeColumns = [0, 1, 2, 3, 4, 5, 6, 7, 8, 15, 16];

  if (mergeColumns.includes(columnIndex)) {
    // 如果当前行有合并信息，返回合并配置
    if (mergeRowRecord.value[rowIndex]) {
      return {
        rowspan: mergeRowRecord.value[rowIndex].rowspan,
        colspan: mergeRowRecord.value[rowIndex].colspan,
      };
    }
  }
  // 不合并的列返回默认值
  return {
    rowspan: 1,
    colspan: 1,
  };
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
