<template>
  <div class="app-container">
    <!-- 预警统计 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="8"
        ><el-card
          ><div slot="header">总预警数</div>
          <el-statistic :value="count.total || 0" /></el-card
      ></el-col>
      <el-col :span="8"
        ><el-card
          ><div slot="header">未处理预警</div>
          <el-statistic :value="count.unHandled || 0" color="red" /></el-card
      ></el-col>
      <el-col :span="8"
        ><el-card
          ><div slot="header">已处理预警</div>
          <el-statistic :value="count.handled || 0" color="green" /></el-card
      ></el-col>
    </el-row>

    <!-- 预警列表（复用若依Table组件） -->
    <el-card>
      <el-table v-loading="loading" :data="warningList" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="warningType" label="预警类型" />
        <el-table-column prop="warningLevel" label="预警级别" />
        <el-table-column prop="analysisTime" label="预警时间" />
        <el-table-column
          prop="isHandled"
          label="处理状态"
          :formatter="formatHandled"
        />
      </el-table>
      <el-pagination
        :total="total"
        v-model:page="pageNum"
        v-model:page-size="pageSize"
        @current-change="getList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import service from "@/utils/request";
const warningLoading = ref(false); // 列表加载态
const countLoading = ref(false); // 统计数据加载态
const warningList = ref([]); // 预警列表数据
const total = ref(0); // 列表总条数
const pageNum = ref(1); // 当前页码
const pageSize = ref(10); // 每页条数
const count = ref({ total: 0, unHandled: 0, handled: 0 }); // 预警统计数据

// 5. 工具函数：格式化处理状态（保留原逻辑，与表格渲染适配）
const formatHandled = (row) => (row.isHandled === 0 ? "未处理" : "已处理");

// 6. 【核心】加载预警统计数据（仿照system页面loadSystemStatus写法）
const loadWarningCount = async () => {
  countLoading.value = true;
  try {
    // 正确请求格式：service({ url: 接口路径, method: 请求方法 })
    const res = await service({
      url: "/kms/analysisResult/count", // 与原接口路径一致
      method: "get", // get请求小写，符合规范
    });
    // 若依后端统一返回{code, msg, data}，直接取data赋值
    count.value = res.data || { total: 0, unHandled: 0, handled: 0 };
  } catch (error) {
    console.error("加载预警统计数据失败：", error);
    // 错误时重置统计数据，避免页面显示异常
    count.value = { total: 0, unHandled: 0, handled: 0 };
  } finally {
    countLoading.value = false; // 无论成败，关闭加载态
  }
};

// 7. 【核心】加载预警列表数据（仿照system页面loadSystemConfig写法）
const getWarningList = async () => {
  warningLoading.value = true;
  try {
    const res = await service({
      url: "/kms/analysisResult/list", // 与原接口路径一致
      method: "get",
      // get请求参数通过params传递，与分页参数适配
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
      },
    });
    // 若依分页接口返回{code, msg, total, rows}，分别赋值
    warningList.value = res.rows || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error("加载预警列表失败：", error);
    // 错误时重置列表数据，避免页面异常
    warningList.value = [];
    total.value = 0;
  } finally {
    warningLoading.value = false; // 关闭加载态
  }
};

// 8. 分页大小变更处理（补充逻辑，适配页码切换）
const handlePageSizeChange = (newPageSize) => {
  pageSize.value = newPageSize;
  pageNum.value = 1; // 切换页大小时重置为第一页
  getWarningList(); // 重新加载列表
};

// 9. 刷新数据（统一刷新统计+列表，与system页面refreshStatus逻辑一致）
const refreshWarningData = async () => {
  // 并行请求，提升效率（仿照Promise.all用法）
  await Promise.all([loadWarningCount(), getWarningList()]);
};

// 10. 页面初始化（仿照system页面onMounted逻辑）
onMounted(async () => {
  // 初始化时同时加载统计和列表数据
  await Promise.all([loadWarningCount(), getWarningList()]);
});
</script>
