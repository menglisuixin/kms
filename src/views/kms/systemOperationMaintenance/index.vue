<template>
  <div class="app-container">
    <!-- 页面标题与操作区 -->
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/kms' }">
        KMS监测系统</el-breadcrumb-item
      >
      <el-breadcrumb-item>系统运维</el-breadcrumb-item>
    </el-breadcrumb>

    <el-row
      :gutter="20"
      class="mb-6"
      style="margin-bottom: 20px; margin-top: 20px"
    >
      <el-col :span="24">
        <el-card>
          <template #header>
            <span class="card-title">模块运行状态</span>
          </template>
          <!-- 状态表格 -->
          <el-table
            v-loading="statusLoading"
            :data="statusTableData"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column
              prop="module"
              label="模块名称"
              align="center"
              width="200"
            />
            <el-table-column
              prop="status"
              label="运行状态"
              align="center"
              width="200"
            >
              <template #default="scope">
                <el-tag
                  :type="
                    scope.row.status === '运行中' ||
                    scope.row.status === '连接正常'
                      ? 'success'
                      : 'danger'
                  "
                  size="medium"
                >
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="模块描述"
              align="center"
            />
            <el-table-column
              prop="checkTime"
              label="最后检查时间"
              align="center"
              width="200"
            />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- CPU预警阈值配置 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="card-title">CPU预警阈值配置</span>
          </template>
          <el-table
            v-loading="configLoading"
            :data="cpuConfigData"
            border
            stripe
          >
            <el-table-column label="阈值区间（%）" align="center" width="120">
              <template #default="scope">
                <span class="config-value">
                  {{ scope.row.range }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="warningLevel"
              label="预警级别"
              align="center"
              width="100"
            >
              <template #default="scope">
                <el-tag
                  :type="getWarningLevelType(scope.row.warningLevel)"
                  size="medium"
                >
                  {{ scope.row.warningLevel }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 内存预警阈值配置 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="card-title">内存预警阈值配置</span>
          </template>
          <el-table
            v-loading="configLoading"
            :data="memoryConfigData"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column label="阈值区间（%）" align="center" width="120">
              <template #default="scope">
                <span class="config-value">
                  {{ scope.row.range }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="warningLevel"
              label="预警级别"
              align="center"
              width="100"
            >
              <template #default="scope">
                <el-tag
                  :type="getWarningLevelType(scope.row.warningLevel)"
                  size="medium"
                >
                  {{ scope.row.warningLevel }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 磁盘预警阈值配置 -->
      <el-col :span="8">
        <el-card style="width: 100%">
          <template #header>
            <span class="card-title">磁盘预警阈值配置</span>
          </template>
          <el-table
            v-loading="configLoading"
            :data="diskConfigData"
            border
            style="width: 100%"
          >
            <el-table-column label="阈值区间（%）" align="center" width="120">
              <template #default="scope">
                <span class="config-value">
                  {{ scope.row.range }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="warningLevel"
              label="预警级别"
              align="center"
              width="100"
            >
              <template #default="scope">
                <el-tag
                  :type="getWarningLevelType(scope.row.warningLevel)"
                  size="medium"
                >
                  {{ scope.row.warningLevel }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
// 1. 正确导入若依request工具（变量名与导出一致，叫service）
import service from "@/utils/request";
import { Refresh, QuestionFilled } from "@element-plus/icons-vue";
import { formatDate } from "@/utils/index";

// 状态管理
const statusLoading = ref(false);
const configLoading = ref(false);
const statusTableData = ref([]);
const cpuConfigData = ref([]);
const memoryConfigData = ref([]);
const diskConfigData = ref([]);

// 工具函数：获取预警级别对应的标签类型
const getWarningLevelType = (level) => {
  const levelMap = {
    无预警: "success",
    基础预警: "info",
    中级预警: "warning",
    严重预警: "danger",
  };
  return levelMap[level] || "default";
};

// 2. 【核心修复】加载模块状态（使用service直接调用）
const loadSystemStatus = async () => {
  statusLoading.value = true;
  try {
    // 正确写法：service({ url: 接口路径, method: 请求方法 })
    const res = await service({
      url: "/kms/system/status", // 接口路径（baseURL已在工具中配置，无需重复写）
      method: "get", // 请求方法（小写）
      // 若有参数，加params: { key: value }（get请求专用）
    });
    // res已被工具处理为后端返回的{code, msg, data}，直接取data
    const statusData = res.data;
    // 转换为表格数据
    statusTableData.value = [
      {
        module: "数据采集器",
        status: statusData.collector,
        description: "负责实时采集CPU、内存、磁盘等关键指标",
        checkTime: formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
      {
        module: "数据分析器",
        status: statusData.analyzer,
        description: "基于阈值判断指标异常，生成预警信息",
        checkTime: formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
      {
        module: "数据库服务",
        status: statusData.database,
        description: "存储实时指标、系统配置、预警结果等数据",
        checkTime: formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
      {
        module: "后端服务",
        status: statusData.backend,
        description: "提供接口服务，支撑前端与后端数据交互",
        checkTime: formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
    ];
  } catch (error) {
    console.error("加载系统状态失败", error);
  } finally {
    statusLoading.value = false; // 无论成败都关闭加载态
  }
};

// 3. 【核心修复】加载阈值配置（同样用service调用）
const loadSystemConfig = async () => {
  configLoading.value = true;
  try {
    const res = await service({
      url: "/kms/system/config",
      method: "get",
    });

    // 将数据按资源类型分类
    cpuConfigData.value = res.data.filter(
      (item) => item.resource === "CPU使用率"
    );
    memoryConfigData.value = res.data.filter(
      (item) => item.resource === "内存使用率"
    );
    diskConfigData.value = res.data.filter(
      (item) => item.resource === "磁盘使用率"
    );
  } catch (error) {
    console.error("加载阈值配置失败", error);
  } finally {
    configLoading.value = false;
  }
};

// 页面初始化
onMounted(async () => {
  await Promise.all([loadSystemStatus(), loadSystemConfig()]);
});
</script>

<style scoped>
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.config-value {
  font-size: 16px;
  font-weight: bold;
  color: #165dff;
}
.info-icon {
  margin-left: 8px;
  color: #606266;
  cursor: help;
}
:deep(.el-table__header) {
  width: 100% !important;
}
:deep(.el-table__body) {
  width: 100% !important;
}
</style>
