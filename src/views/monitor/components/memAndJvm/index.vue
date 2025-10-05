<template>
  <div class="mem-jvm-charts-container" style="height: 240px">
    <div class="chart-wrapper">
      <div id="memChart" style="width: 100%; height: 100%"></div>
    </div>
    <div class="chart-wrapper">
      <div id="jvmChart" style="width: 100%; height: 100%"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from "vue";
import * as echarts from "echarts";

// 定义组件接收的props
const props = defineProps({
  serverData: {
    type: Object,
    default: () => ({})
  }
});

// 图表实例
let memChart = null;
let jvmChart = null;

// 初始化内存图表
function initMemChart() {
  const chartDom = document.getElementById("memChart");
  if (chartDom) {
    memChart = echarts.init(chartDom);
    updateMemChart();
  }
}

// 初始化JVM图表
function initJvmChart() {
  const chartDom = document.getElementById("jvmChart");
  if (chartDom) {
    jvmChart = echarts.init(chartDom);
    updateJvmChart();
  }
}

// 更新内存图表数据
function updateMemChart() {
  if (!memChart || !props.serverData.mem) {
    return;
  }

  // 获取内存数据
  const totalMem = parseFloat(props.serverData.mem.total);
  const usedMem = parseFloat(props.serverData.mem.used);
  const freeMem = parseFloat(props.serverData.mem.free);
  const memUsage = props.serverData.mem.usage;

  // 根据使用率确定颜色
  const usedColor = memUsage > 80 ? "#F57474" : "#1089E7";
  const freeColor = "#52c41a";

  const option = {
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        return (
          `总内存: ${totalMem}G<br/>` +
          `${params.name}: ${params.value}G (${params.percent}%)`
        );
      },
    },
    legend: {
      bottom: "0%",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: "#333",
        fontSize: 12,
      },
    },
    series: [
      {
        name: "内存使用情况",
        type: "pie",
        center: ["50%", "50%"],
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
        },
        labelLine: {
          show: false,
        },
        color: [usedColor, freeColor],
        data: [
          { value: usedMem, name: "已用内存" },
          { value: freeMem, name: "剩余内存" },
        ],
      },
    ],
  };

  memChart.setOption(option);
}

// 更新JVM图表数据
function updateJvmChart() {
  if (!jvmChart || !props.serverData.jvm) {
    return;
  }

  // 获取JVM数据
  const totalJvm = parseFloat(props.serverData.jvm.total);
  const usedJvm = parseFloat(props.serverData.jvm.used);
  const freeJvm = parseFloat(props.serverData.jvm.free);
  const jvmUsage = props.serverData.jvm.usage;

  // 根据使用率确定颜色
  const usedColor = jvmUsage > 80 ? "#F57474" : "#8B78F6";
  const freeColor = "#56D0E3";

  const option = {
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        return (
          `总JVM内存: ${totalJvm}M<br/>` +
          `${params.name}: ${params.value}M (${params.percent}%)`
        );
      },
    },
    legend: {
      bottom: "0%",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: "#333",
        fontSize: 12,
      },
    },
    series: [
      {
        name: "JVM使用情况",
        type: "pie",
        center: ["50%", "50%"],
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
        },
        labelLine: {
          show: false,
        },
        color: [usedColor, freeColor],
        data: [
          { value: usedJvm, name: "已用JVM" },
          { value: freeJvm, name: "剩余JVM" },
        ],
      },
    ],
  };

  jvmChart.setOption(option);
}

// 监听服务器数据变化，更新图表
watch(() => props.serverData, () => {
  updateMemChart();
  updateJvmChart();
}, { deep: true });

// 窗口大小变化时重新调整图表大小
function handleResize() {
  if (memChart) {
    memChart.resize();
  }
  if (jvmChart) {
    jvmChart.resize();
  }
}

onMounted(() => {
  nextTick(() => {
    initMemChart();
    initJvmChart();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (memChart) {
    memChart.dispose();
    memChart = null;
  }
  if (jvmChart) {
    jvmChart.dispose();
    jvmChart = null;
  }
});
</script>

<style scoped>
.mem-jvm-charts-container {
  width: 100%;
  height: 240px;
  display: flex;
  justify-content: space-between;
}

.chart-wrapper {
  width: 48%;
  height: 100%;
}

/* 窗口大小变化时重新调整图表大小 */
@media screen and (max-width: 768px) {
  .mem-jvm-charts-container {
    flex-direction: column;
  }

  .chart-wrapper {
    width: 100%;
    height: 50%;
  }
}
</style>