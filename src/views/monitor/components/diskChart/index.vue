<template>
  <div class="disk-chart-container" style="height: 400px">
    <div id="diskChart" style="width: 100%; height: 100%"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, nextTick, defineProps } from "vue";
import * as echarts from "echarts";

// 接收父组件传递的磁盘数据
const props = defineProps({
  sysFiles: {
    type: Array,
    default: () => [],
  },
});

let diskChart = null;

// 初始化磁盘图表
function initDiskChart() {
  const chartDom = document.getElementById("diskChart");
  if (chartDom) {
    diskChart = echarts.init(chartDom);
    // 窗口大小变化时重新调整图表大小
    window.addEventListener("resize", () => {
      if (diskChart) {
        diskChart.resize();
      }
    });
  }
}

// 更新磁盘图表数据
function updateDiskChart(sysFiles) {
  if (!diskChart || !sysFiles || sysFiles.length === 0) {
    return;
  }

  const myColor = ["#1089E7", "#F57474", "#56D0E3", "#F8B448", "#8B78F6"];
  const dirNames = sysFiles.map((file) => file.dirName);
  const usages = sysFiles.map((file) => file.usage);
  const totalSize = sysFiles.map((file) => file.total);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const index = params[0].dataIndex;
        const file = sysFiles[index];
        return (
          `${file.dirName}<br/>` +
          `总大小: ${file.total}<br/>` +
          `已用大小: ${file.used} (${file.usage}%)<br/>` +
          `可用大小: ${file.free} (${100 - file.usage}%)`
        );
      },
    },
    xAxis: {
      show: false,
    },
    yAxis: [
      {
        type: "category",
        data: dirNames,
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
        data: totalSize,
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
        data: usages,
        barWidth: 10,
        barCategoryGap: 50,
        itemStyle: {
          barBorderRadius: 20,
          color: function (params) {
            // 如果使用率超过80%，使用红色
            if (params.data > 80) {
              return "#F57474";
            }
            var num = myColor.length;
            return myColor[params.dataIndex % num];
          },
        },
        label: {
          show: true,
          position: "inside",
          formatter: "{c}%",
        },
        yAxisIndex: 0,
      },
      {
        name: "背景框",
        type: "bar",
        barCategoryGap: 50,
        barWidth: 15,
        data: new Array(usages.length).fill(100),
        itemStyle: {
          barBorderRadius: 20,
          color: "none",
          borderColor: "#00c1de",
          borderWidth: 3,
          barBorderRadius: 15,
        },
        yAxisIndex: 1,
      },
    ],
  };

  diskChart.setOption(option);
}

// 监听数据变化，更新图表
watch(
  () => props.sysFiles,
  (newSysFiles) => {
    updateDiskChart(newSysFiles);
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    initDiskChart();
    updateDiskChart(props.sysFiles);
  });
});

onUnmounted(() => {
  if (diskChart) {
    diskChart.dispose();
    diskChart = null;
  }
});
</script>

<style scoped>
.disk-chart-container {
  width: 100%;
  height: 400px;
}
</style>
