<template>
  <div class="app-container">
    <el-row>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header
            ><Cpu style="width: 1em; height: 1em; vertical-align: middle" />
            <span style="vertical-align: middle">CPU</span></template
          >
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <table cellspacing="0" style="width: 100%">
              <thead>
                <tr>
                  <th class="el-table__cell is-leaf">
                    <div class="cell">属性</div>
                  </th>
                  <th class="el-table__cell is-leaf">
                    <div class="cell">值</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">核心数</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell" v-if="server.cpu">
                      {{ server.cpu.cpuNum }}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">用户使用率</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell" v-if="server.cpu">
                      {{ server.cpu.used }}%
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">系统使用率</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell" v-if="server.cpu">
                      {{ server.cpu.sys }}%
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">当前空闲率</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell" v-if="server.cpu">
                      {{ server.cpu.free }}%
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="card-box">
        <el-card>
          <template #header
            ><Tickets style="width: 1em; height: 1em; vertical-align: middle" />
            <span style="vertical-align: middle">内存与JVM</span></template
          >
          <!-- 替换为两个饼图 -->
          <div class="mem-jvm-charts-container" style="height: 240px">
            <div class="chart-wrapper">
              <div id="memChart" style="width: 100%; height: 100%"></div>
            </div>
            <div class="chart-wrapper">
              <div id="jvmChart" style="width: 100%; height: 100%"></div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="24" class="card-box">
        <el-card>
          <template #header
            ><MessageBox
              style="width: 1em; height: 1em; vertical-align: middle"
            />
            <span style="vertical-align: middle">磁盘状态</span></template
          >
          <DiskChart :sys-files="server.sysFiles || []" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, getCurrentInstance, nextTick } from "vue";
import { getServer } from "@/api/monitor/server";
// 导入磁盘图表子组件
import DiskChart from "../components/diskChart/index.vue";
import * as echarts from "echarts";

// 服务器监控数据
const server = ref({});
const { proxy } = getCurrentInstance();

// 图表实例
let memChart = null;
let jvmChart = null;

// 轮询相关
let pollTimer = null;
let isFetching = false;
const POLL_INTERVAL = 1000; // 轮询间隔，单位毫秒，按需调整

async function fetchServer(showLoading = false) {
  if (isFetching) return;
  isFetching = true;
  if (showLoading) proxy.$modal.loading("正在加载服务监控数据，请稍候！");
  try {
    const response = await getServer();
    server.value = response.data;
    // 更新内存和JVM图表
    updateMemChart();
    updateJvmChart();
  } catch (err) {
    console.error("获取服务监控数据失败：", err);
  } finally {
    isFetching = false;
    if (showLoading) proxy.$modal.closeLoading();
  }
}

function startPolling() {
  // 首次请求显示 loading
  fetchServer(true);
  pollTimer = setInterval(() => {
    fetchServer(false);
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

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
  if (!memChart || !server.value.mem) {
    return;
  }

  // 获取内存数据
  const totalMem = parseFloat(server.value.mem.total);
  const usedMem = parseFloat(server.value.mem.used);
  const freeMem = parseFloat(server.value.mem.free);
  const memUsage = server.value.mem.usage;

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
  if (!jvmChart || !server.value.jvm) {
    return;
  }

  // 获取JVM数据
  const totalJvm = parseFloat(server.value.jvm.total);
  const usedJvm = parseFloat(server.value.jvm.used);
  const freeJvm = parseFloat(server.value.jvm.free);
  const jvmUsage = server.value.jvm.usage;

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

onMounted(() => {
  nextTick(() => {
    initMemChart();
    initJvmChart();
    startPolling();
  });
});

onUnmounted(() => {
  stopPolling();
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
