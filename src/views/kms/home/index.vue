<template>
  <div class="app-container">
    <!-- 指标卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="8">
        <el-card>
          <div slot="header">CPU使用率</div>
          <el-statistic :value="latestData.cpuUsage || 0" suffix="%" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div slot="header">内存使用率</div>
          <el-statistic :value="latestData.memUsage || 0" suffix="%" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div slot="header">磁盘使用率</div>
          <el-statistic :value="latestData.diskUsage || 0" suffix="%" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 折线图 -->
    <el-card>
      <div slot="header">指标趋势图</div>
      <div ref="chartRef" class="chart-container" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import service from "@/utils/request";
import * as echarts from "echarts";

const chartRef = ref(null);
const latestData = ref({}); // 最新数据
const historyData = ref([]); // 历史数据
let chart = null;
let intervalId = null;

// 1. 【核心修改】获取最新数据（用后端list接口查最新1条，按collectTime倒序）
const fetchLatestData = async () => {
  try {
    const res = await service.get("/kms/realTimeData/list", {
      params: {
        pageNum: 1, // 第1页
        pageSize: 1, // 1条数据（最新的1条）
        orderByColumn: "collectTime", // 按“采集时间”排序
        isAsc: "desc" // 倒序（最新的在前）
      }
    });
    // 后端TableDataInfo格式：{total: 总数, rows: 数据列表}
    if (res.rows && res.rows.length > 0) {
      latestData.value = res.rows[0]; // 取第一条（最新）
    }
  } catch (error) {
    console.error("获取最新数据失败：", error);
  }
};

// 2. 【核心修改】获取历史数据（直接用后端list接口分页）
const fetchHistoryData = async () => {
  try {
    const res = await service.get("/kms/realTimeData/list", {
      params: {
        pageNum: 1, // 第1页（可根据需求调整）
        pageSize: 20, // 20条数据（匹配前端原需求）
        orderByColumn: "collectTime",
        isAsc: "desc"
      }
    });
    // 后端返回的rows就是历史数据列表
    historyData.value = res.rows;
    return res.rows;
  } catch (error) {
    console.error("获取历史数据失败：", error);
    return [];
  }
};

// 初始化图表
const initChart = (data) => {
  if (!chartRef.value || data.length === 0) return;
  chart = echarts.init(chartRef.value);
  const option = {
    xAxis: {
      type: "category",
      data: data.map((item) => item.collectTime) // 后端realTimeData的“采集时间”字段
    },
    yAxis: { type: "value", max: 100, name: "%" },
    series: [
      {
        name: "CPU",
        type: "line",
        data: data.map((item) => item.cpuUsage) // 后端realTimeData的“CPU使用率”字段
      },
      {
        name: "内存",
        type: "line",
        data: data.map((item) => item.memUsage) // 后端realTimeData的“内存使用率”字段
      },
      {
        name: "磁盘",
        type: "line",
        data: data.map((item) => item.diskUsage) // 后端realTimeData的“磁盘使用率”字段
      }
    ]
  };
  chart.setOption(option);
};

// 更新图表
const updateChart = (data) => {
  if (!chart || data.length === 0) return;
  chart.setOption({
    xAxis: { data: data.map((item) => item.collectTime) },
    series: [
      { data: data.map((item) => item.cpuUsage) },
      { data: data.map((item) => item.memUsage) },
      { data: data.map((item) => item.diskUsage) }
    ]
  });
};

// 页面加载初始化
onMounted(async () => {
  await fetchLatestData();
  const historyList = await fetchHistoryData();
  initChart(historyList);

  // 定时刷新（5分钟）
  intervalId = setInterval(async () => {
    await fetchLatestData();
    const newHistoryList = await fetchHistoryData();
    updateChart(newHistoryList);
  }, 300000);
});

// 组件卸载清理
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (chart) chart.dispose();
});
</script>

<style scoped>
.chart-container {
  height: 400px;
}
</style>