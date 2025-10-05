<template>
  <div class="cpu-chart-container" style="height: 240px">
    <div id="cpuChart" style="width: 100%; height: 100%"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from "vue";
import * as echarts from "echarts";

// 定义组件接收的props
const props = defineProps({
  serverData: {
    type: Object,
    default: () => ({}),
  },
});

// 图表实例
let cpuChart = null;

// 存储历史数据的数据结构
const MAX_DATA_POINTS = 10; // 最大显示数据点数
const cpuHistoryData = ref({
  timestamps: [],
  userUsage: [],
  sysUsage: [],
  freeUsage: [],
});

// 生成时间戳
function generateTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 初始化CPU图表
function initCpuChart() {
  const chartDom = document.getElementById("cpuChart");
  if (chartDom) {
    cpuChart = echarts.init(chartDom);
    updateCpuChart();
  }
}

// 更新CPU历史数据
function updateCpuHistory() {
  if (!props.serverData.cpu) {
    return;
  }

  const timestamp = generateTimestamp();
  const userUsage = parseFloat(props.serverData.cpu.used) || 0;
  const sysUsage = parseFloat(props.serverData.cpu.sys) || 0;
  const freeUsage = parseFloat(props.serverData.cpu.free) || 0;

  // 添加新数据
  cpuHistoryData.value.timestamps.push(timestamp);
  cpuHistoryData.value.userUsage.push(userUsage);
  cpuHistoryData.value.sysUsage.push(sysUsage);
  cpuHistoryData.value.freeUsage.push(freeUsage);

  // 保持数据点数量不超过最大值（滚动效果）
  if (cpuHistoryData.value.timestamps.length > MAX_DATA_POINTS) {
    cpuHistoryData.value.timestamps.shift();
    cpuHistoryData.value.userUsage.shift();
    cpuHistoryData.value.sysUsage.shift();
    cpuHistoryData.value.freeUsage.shift();
  }
}

// 更新CPU图表数据
function updateCpuChart() {
  if (!cpuChart) {
    return;
  }

  // 更新历史数据
  updateCpuHistory();

  const option = {
    title: {
      text: "CPU使用率趋势",
      left: "center",
      textStyle: {
        fontSize: 14,
        fontWeight: "normal",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
      formatter: function (params) {
        let result = params[0].axisValue + "<br/>";
        params.forEach(function (item) {
          result +=
            item.marker + item.seriesName + ": " + item.value + "%<br/>";
        });
        return result;
      },
    },
    legend: {
      data: ["用户使用率", "系统使用率", "空闲率"],
      bottom: 0,
      textStyle: {
        fontSize: 12,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "20%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: cpuHistoryData.value.timestamps,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      name: "使用率(%)",
      nameTextStyle: {
        fontSize: 12,
      },
      axisLabel: {
        formatter: "{value}%",
      },
      min: 0,
      max: 100,
    },
    series: [
      {
        name: "用户使用率",
        type: "line",
        data: cpuHistoryData.value.userUsage,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: "#FF6B6B",
        },
        itemStyle: {
          color: "#FF6B6B",
        },
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
        data: cpuHistoryData.value.sysUsage,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: "#4ECDC4",
        },
        itemStyle: {
          color: "#4ECDC4",
        },
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
        data: cpuHistoryData.value.freeUsage,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: "#45B7D1",
        },
        itemStyle: {
          color: "#45B7D1",
        },
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
}

// 监听服务器数据变化，更新图表
watch(
  () => props.serverData,
  () => {
    updateCpuChart();
  },
  { deep: true }
);

// 窗口大小变化时重新调整图表大小
function handleResize() {
  if (cpuChart) {
    cpuChart.resize();
  }
}

onMounted(() => {
  nextTick(() => {
    initCpuChart();
  });
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (cpuChart) {
    cpuChart.dispose();
    cpuChart = null;
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.cpu-chart-container {
  width: 100%;
  height: 240px;
}

#cpuChart {
  width: 100%;
  height: 100%;
}
</style>
