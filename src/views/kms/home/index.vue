<template>
  <div class="app-container">
    <!-- 指标卡片：CPU、内存、磁盘使用率 -->
    <el-row>
      <el-col :span="24" class="card-box">
        <el-card>
          <template #header>
            <Cpu style="width: 1em; height: 1em; vertical-align: middle" />
            <span style="vertical-align: middle">CPU</span>
          </template>
          <div class="cpu-chart-container" style="height: 300px">
            <div ref="cpuChartRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <Tickets style="width: 1em; height: 1em; vertical-align: middle" />
            <span style="vertical-align: middle">MEM</span>
          </template>
          <div class="chart-wrapper" style="height: 300px">
            <div ref="memChartRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <MessageBox
              style="width: 1em; height: 1em; vertical-align: middle"
            />
            <span style="vertical-align: middle">DISC</span>
          </template>
          <div class="disk-chart-container" style="height: 300px">
            <div ref="diskChartRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import service from "@/utils/request";
import * as echarts from "echarts";

// 图表引用
const cpuChartRef = ref(null);
const memChartRef = ref(null);
const diskChartRef = ref(null);

// 数据存储
const sortedHistoryData = ref([]); // 排序后的完整数据
const latestData = ref({
  cpuUsage: 0,
  cpuUserUsage: 0,
  cpuSysUsage: 0,
  cpuIdleUsage: 0,
  memUsage: 0,
  memTotal: 0,
  memUsed: 0,
  memFree: 0,
});
// 修改磁盘数据结构为数组，支持任意数量的磁盘
const latestDiskData = ref({
  disks: [] // 存储所有磁盘信息的数组
});

const TIME_POINT_COUNT = 20; // 要保留的时间点数量
const RECORDS_PER_TIME = 3; // 每个时间点的记录数（C/D/E盘）
const PAGE_SIZE = TIME_POINT_COUNT * RECORDS_PER_TIME; // 60条，刚好覆盖20个时间点

// 图表实例
let cpuChart = null;
let memChart = null;
let diskChart = null;
let intervalId = null;

// 1. 格式化时间：YYYY-MM-DD HH:mm:ss → HH:mm:ss（图表X轴用）
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  return timeStr.split(" ")[1];
};

// 2. 核心排序逻辑：先按时间倒序
const sortData = (rawData) => {
  const data = [...rawData];
  return data.sort((a, b) => {
    // 按时间倒序（最新在前）
    return new Date(b.collectTime) - new Date(a.collectTime);
  });
};

// 3. 提取最新数据（从排序后的第一条数据中取）
const extractLatestData = (sortedData) => {
  if (sortedData.length === 0) return;

  const firstItem = sortedData[0];
  // 提取CPU和内存数据
  latestData.value = {
    cpuUsage: Number(firstItem.cpuUsage) || 0,
    cpuUserUsage: Number(firstItem.cpuUserUsage) || 0,
    cpuSysUsage: Number(firstItem.cpuSysUsage) || 0,
    cpuIdleUsage: Number(firstItem.cpuIdleUsage) || 0,
    memUsage: Number(firstItem.memUsage) || 0,
    memTotal: Number(firstItem.memTotal) || 0,
    memUsed: Number(firstItem.memUsed) || 0,
    memFree: Number(firstItem.memFree) || 0,
  };

  // 提取磁盘数据（实际数据在diskData字段，且是JSON字符串）
  if (firstItem.diskData) {
    try {
      // 解析JSON字符串
      const disks = JSON.parse(firstItem.diskData);
      console.log("解析到的磁盘数据:", disks);

      // 清空之前的磁盘数据
      latestDiskData.value.disks = [];

      if (Array.isArray(disks)) {
        disks.forEach((disk) => {
          // 动态添加所有磁盘信息，不再硬编码C/D/E盘
          latestDiskData.value.disks.push({
            path: disk.path || "",
            usage: Number(disk.usage) || 0,
            type: disk.type || "",
            total: Number(disk.total) || 0,
            used: Number(disk.used) || 0,
            free: Number(disk.free) || 0,
            // 添加显示名称，如C盘、D盘等
            displayName: getDiskDisplayName(disk.path)
          });
        });
      }
    } catch (error) {
      console.error("解析磁盘数据失败：", error);
    }
  }
};

// 辅助函数：获取磁盘显示名称
const getDiskDisplayName = (diskPath) => {
  if (!diskPath) return "未知磁盘";
  // 处理路径格式，无论是 "C:\" 还是 "C:\\\" 都能正确匹配
  const driveLetter = diskPath.match(/^([A-Za-z]:)/);
  return driveLetter ? `${driveLetter[1].replace(':', '盘')}` : "未知磁盘";
};

// 4. 获取历史数据
const fetchHistoryData = async () => {
  try {
    const res = await service.get("/kms/realTimeData/list", {
      params: {
        pageNum: 1,
        pageSize: TIME_POINT_COUNT, // 只需获取20个时间点的数据
        orderByColumn: "collectTime",
        isAsc: "desc",
      },
    });
    console.log(res);
    // 排序+截取：确保只保留最新的20个时间点
    let sortedData = sortData(res.rows || []);
    sortedData = sortedData.slice(0, TIME_POINT_COUNT);

    sortedHistoryData.value = sortedData;
    extractLatestData(sortedData);
    return sortedData;
  } catch (error) {
    console.error("获取历史数据失败：", error);
    return [];
  }
};

// 5. 定时获取最新数据
const fetchLatestData = async () => {
  try {
    const res = await service.get("/kms/realTimeData/list", {
      params: {
        pageNum: 1,
        pageSize: TIME_POINT_COUNT,
        orderByColumn: "collectTime",
        isAsc: "desc",
      },
    });
    console.log(res);
    // 排序+截取：保留最新的20个时间点
    let sortedData = sortData(res.rows || []);
    sortedData = sortedData.slice(0, TIME_POINT_COUNT);

    sortedHistoryData.value = sortedData;
    extractLatestData(sortedData);
    updateCharts();
  } catch (error) {
    console.error("获取最新数据失败：", error);
  }
};

// 6. 初始化CPU图表
const initCpuChart = () => {
  if (!cpuChartRef.value) return;
  cpuChart = echarts.init(cpuChartRef.value);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", label: { backgroundColor: "#6a7985" } },
      formatter: function (params) {
        let result = "";
        params.forEach(function (item) {
          result +=
            item.marker + item.seriesName + ": " + item.value + "%<br/>";
        });
        return result;
      },
    },
    legend: {
      data: ["用户使用率", "系统使用率", "空闲率"],
      textStyle: { color: "#333" },
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [],
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: {
        color: "#666",
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      max: 100,
      name: "使用率(%)",
      nameTextStyle: { fontSize: 12 },
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: { color: "#666", formatter: "{value}%" },
      splitLine: { lineStyle: { color: "#f0f0f0" } },
    },
    series: [
      {
        name: "用户使用率",
        type: "line",
        data: [],
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: "#FF6B6B" },
        itemStyle: { color: "#FF6B6B" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 107, 107, 0.3)" },
              { offset: 1, color: "rgba(255, 107, 107, 0.1)" },
            ],
          },
        },
      },
      {
        name: "系统使用率",
        type: "line",
        data: [],
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: "#4ECDC4" },
        itemStyle: { color: "#4ECDC4" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(78, 205, 196, 0.3)" },
              { offset: 1, color: "rgba(78, 205, 196, 0.1)" },
            ],
          },
        },
      },
      {
        name: "空闲率",
        type: "line",
        data: [],
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: "#45B7D1" },
        itemStyle: { color: "#45B7D1" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(69, 183, 209, 0.3)" },
              { offset: 1, color: "rgba(69, 183, 209, 0.1)" },
            ],
          },
        },
      },
    ],
    animation: true,
    animationDuration: 300,
    animationEasing: "linear",
  };

  cpuChart.setOption(option);
};

// 7. 初始化内存图表
const initMemChart = () => {
  if (!memChartRef.value) return;
  memChart = echarts.init(memChartRef.value);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", label: { backgroundColor: "#6a7985" } },
      formatter: function (params) {
        let result = "";
        params.forEach(function (item) {
          result +=
            item.marker + item.seriesName + ": " + item.value + "%<br/>";
        });
        return result;
      },
    },
    legend: {
      data: ["mem使用率"],
      textStyle: { color: "#333" },
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [],
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: {
        color: "#666",
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      max: 100,
      name: "使用率(%)",
      nameTextStyle: { fontSize: 12 },
      axisLine: { lineStyle: { color: "#999" } },
      axisLabel: { color: "#666", formatter: "{value}%" },
      splitLine: { lineStyle: { color: "#f0f0f0" } },
    },
    series: [
      {
        name: "内存使用率",
        type: "line",
        data: [],
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color: "#FF8C42" },
        itemStyle: { color: "#FF8C42" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 140, 66, 0.3)" },
              { offset: 1, color: "rgba(255, 140, 66, 0.1)" },
            ],
          },
        },
      },
    ],
    animation: true,
    animationDuration: 300,
    animationEasing: "linear",
  };

  memChart.setOption(option);
};

// 8. 初始化磁盘图表 - 修改为水平条形图
const initDiskChart = () => {
  if (!diskChartRef.value) return;
  diskChart = echarts.init(diskChartRef.value);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const index = params[0].dataIndex;
        const diskData = latestDiskData.value.disks[index];
        if (!diskData) return "";
        return (
          `${diskData.displayName}<br/>` +
          `总大小: ${diskData.total}GB<br/>` +
          `已用大小: ${diskData.used}GB (${params[0].value}%)<br/>` +
          `剩余大小: ${diskData.free}GB (${100 - params[0].value}%)`
        );
      },
    },
    xAxis: {
      show: false,
    },
    yAxis: [
      {
        type: "category",
        data: [], // 初始为空，会在updateCharts中动态更新
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#333",
        },
        inverse: true,
      },
      {
        type: "category",
        inverse: true,
        data: [], // 初始为空，会在updateCharts中动态更新
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#333",
        },
      },
    ],
    series: [
      {
        name: "磁盘使用率",
        type: "bar",
        data: [], // 初始为空，会在updateCharts中动态更新
        barWidth: 10,
        barCategoryGap: 50,
        itemStyle: {
          barBorderRadius: 20,
          color: function (params) {
            const usage = params.data;
            if (usage > 80) {
              return "#F57474"; // 红色
            } else if (usage > 60) {
              return "#1089E7"; // 蓝色
            } else {
              return "#52c41a"; // 绿色
            }
          },
        },
        label: {
          show: true,
          position: "inside",
          formatter: "{c}%",
          color: "#fff",
        },
        yAxisIndex: 0,
      },
      {
        name: "背景框",
        type: "bar",
        barCategoryGap: 50,
        barWidth: 15,
        data: [], // 初始为空，会在updateCharts中动态更新
        itemStyle: {
          barBorderRadius: 20,
          color: "none",
          borderColor: "#00c1de",
          borderWidth: 3,
        },
        yAxisIndex: 1,
      },
    ],
    animation: true,
    animationDuration: 300,
    animationEasing: "linear",
  };

  diskChart.setOption(option);
};

// 9. 更新所有图表数据 - 添加磁盘总大小单位
const updateCharts = () => {
  if (
    !cpuChart ||
    !memChart ||
    !diskChart ||
    sortedHistoryData.value.length === 0
  )
    return;

  // 提取20个不重复的时间点（按正序排列）
  const uniqueTimes = [
    ...new Set(sortedHistoryData.value.map((item) => item.collectTime)),
  ].sort((a, b) => new Date(a) - new Date(b));
  const xAxisData = uniqueTimes.map((time) => formatTime(time));

  // 提取CPU数据
  const cpuUserData = [];
  const cpuSysData = [];
  const cpuIdleData = [];

  // 提取内存数据
  const memUsageData = [];

  uniqueTimes.forEach((time) => {
    const timeItems = sortedHistoryData.value.filter(
      (item) => item.collectTime === time
    );
    const cpuMemItem = timeItems[0] || {};

    // CPU数据
    cpuUserData.push(Number(cpuMemItem.cpuUserUsage) || 0);
    cpuSysData.push(Number(cpuMemItem.cpuSysUsage) || 0);
    cpuIdleData.push(Number(cpuMemItem.cpuIdleUsage) || 0);

    // 内存数据
    memUsageData.push(Number(cpuMemItem.memUsage) || 0);
  });

  // 更新CPU图表
  cpuChart.setOption({
    xAxis: { data: xAxisData },
    series: [
      { name: "用户使用率", data: cpuUserData },
      { name: "系统使用率", data: cpuSysData },
      { name: "空闲率", data: cpuIdleData },
    ],
  });

  // 更新内存图表
  memChart.setOption({
    xAxis: { data: xAxisData },
    series: [{ name: "内存使用率", data: memUsageData }],
  });

  // 打印CPU图表数据用于调试
  console.log("CPU图表数据:", { xAxisData, cpuUserData, cpuSysData, cpuIdleData });

  // 打印内存图表数据用于调试
  console.log("内存图表数据:", { xAxisData, memUsageData });

  // 更新磁盘图表（水平条形图）- 动态处理任意数量的磁盘
  const disks = latestDiskData.value.disks;
  const diskNames = disks.map(disk => disk.displayName);
  const diskUsages = disks.map(disk => disk.usage);
  const totalSizes = disks.map(disk => disk.total + "GB");
  const backgroundData = Array(disks.length).fill(100);

  // 打印磁盘图表数据用于调试
  console.log("磁盘图表数据:", { diskNames, diskUsages, totalSizes });

  diskChart.setOption({
    yAxis: [
      { data: diskNames },
      { data: totalSizes }
    ],
    series: [
      {
        name: "磁盘使用率",
        data: diskUsages,
      },
      {
        name: "背景框",
        data: backgroundData,
      },
    ],
  });
};

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  if (cpuChart) cpuChart.resize();
  if (memChart) memChart.resize();
  if (diskChart) diskChart.resize();
};

// 页面初始化
onMounted(async () => {
  await fetchHistoryData();
  initCpuChart();
  initMemChart();
  initDiskChart();
  updateCharts();

  // 10秒定时刷新
  intervalId = setInterval(async () => {
    await fetchLatestData();
  }, 10000);

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
});

// 组件卸载清理
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (cpuChart) {
    cpuChart.dispose();
    cpuChart = null;
  }
  if (memChart) {
    memChart.dispose();
    memChart = null;
  }
  if (diskChart) {
    diskChart.dispose();
    diskChart = null;
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped></style>
