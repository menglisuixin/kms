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
      <div slot="header">CPU</div>
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
        isAsc: "desc", // 倒序（最新的在前）
      },
    });
    // 后端TableDataInfo格式：{total: 总数, rows: 数据列表}
    if (res.rows && res.rows.length > 0) {
      latestData.value = res.rows[0]; // 取第一条（最新）
      // 将最新数据添加到历史数据开头
      addLatestDataToHistory(res.rows[0]);
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
        isAsc: "desc",
      },
    });
    // 后端返回的rows就是历史数据列表
    historyData.value = res.rows;
    return res.rows;
  } catch (error) {
    console.error("获取历史数据失败：", error);
    return [];
  }
};

// 添加最新数据到历史数据，并保持固定长度
const addLatestDataToHistory = (newData) => {
  // 检查是否已经存在相同时间戳的数据
  const isDuplicate = historyData.value.some(
    item => item.collectTime === newData.collectTime
  );

  if (!isDuplicate) {
    // 修改：将新数据添加到数组末尾，而不是开头
    historyData.value.push(newData);

    // 如果数组长度超过20，移除最旧的数据（数组开头的数据）
    if (historyData.value.length > 20) {
      historyData.value.shift();
    }

    // 立即更新图表显示最新数据
    updateChart(historyData.value);
  }
};

// 初始化图表
const initChart = (data) => {
  if (!chartRef.value || data.length === 0) return;
  chart = echarts.init(chartRef.value);
  // 修改：数据不需要反转，直接使用
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
    },
    legend: {
      data: ["CPU", "内存", "磁盘"],
      textStyle: {
        color: "#333",
      },
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.collectTime),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#999",
        },
      },
      axisLabel: {
        color: "#666",
      },
    },
    yAxis: {
      type: "value",
      max: 100,
      name: "%",
      axisLine: {
        lineStyle: {
          color: "#999",
        },
      },
      axisLabel: {
        color: "#666",
        formatter: "{value}%",
      },
      splitLine: {
        lineStyle: {
          color: "#f0f0f0",
        },
      },
    },
    series: [
      {
        name: "CPU",
        type: "line",
        data: data.map((item) => item.cpuUsage),
        lineStyle: {
          color: "#ff6b6b",
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(255, 107, 107, 0.3)" },
            { offset: 1, color: "rgba(255, 107, 107, 0.05)" },
          ]),
        },
        itemStyle: { color: "#ff6b6b" },
        symbol: "circle",
        symbolSize: 8,
      },
      {
        name: "内存",
        type: "line",
        // 修改：直接使用数据，不反转
        data: data.map((item) => item.memUsage),
        lineStyle: {
          color: "#4ecdc4",
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(78, 205, 196, 0.3)" },
            { offset: 1, color: "rgba(78, 205, 196, 0.05)" },
          ]),
        },
        itemStyle: { color: "#4ecdc4" },
        symbol: "circle",
        symbolSize: 8,
      },
      {
        name: "磁盘",
        type: "line",
        data: data.map((item) => item.diskUsage),
        lineStyle: {
          color: "#45b7d1",
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(69, 183, 209, 0.3)" },
            { offset: 1, color: "rgba(69, 183, 209, 0.05)" },
          ]),
        },
        itemStyle: { color: "#45b7d1" },
        symbol: "circle",
        symbolSize: 8,
      },
    ],
  };
  chart.setOption(option);
};

// 更新图表
const updateChart = (data) => {
  if (!chart || data.length === 0) return;
  chart.setOption({
    // 修改：直接使用数据，不反转
    xAxis: { data: data.map((item) => item.collectTime) },
    series: [
      // 修改：直接使用数据，不反转
      { data: data.map((item) => item.cpuUsage) },
      { data: data.map((item) => item.memUsage) },
      { data: data.map((item) => item.diskUsage) },
    ],
  });
};

// 页面加载初始化
onMounted(async () => {
  await fetchLatestData();
  const historyList = await fetchHistoryData();
  console.log(historyList);
  // 修改：将历史数据反转，确保时间顺序从旧到新
  initChart(historyList.reverse());

  // 定时刷新（每种采集一次数据，设置为10秒间隔）
  intervalId = setInterval(async () => {
    await fetchLatestData();
  }, 10000); // 10秒采集一次数据
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
