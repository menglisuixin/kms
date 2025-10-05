<template>
  <div class="app-container">
    <el-row>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header
            ><Cpu style="width: 1em; height: 1em; vertical-align: middle" />
            <span style="vertical-align: middle">CPU</span></template
          >
          <!-- 使用CPU图表组件 -->
          <CpuChart :server-data="server" />
          <!-- CPU核心数信息 -->
          <div style="margin-top: 10px; text-align: center; font-size: 12px; color: #666;">
            CPU核心数: {{ server.cpu ? server.cpu.cpuNum : 0 }}
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="card-box">
        <el-card>
          <template #header
            ><Tickets style="width: 1em; height: 1em; vertical-align: middle" />
            <span style="vertical-align: middle">内存与JVM</span></template
          >
          <!-- 使用内存与JVM图表组件 -->
          <MemAndJvmChart :server-data="server" />
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
import { onMounted, onUnmounted, ref, getCurrentInstance } from "vue";
import { getServer } from "@/api/monitor/server";
import DiskChart from "../components/diskChart/index.vue";
import MemAndJvmChart from "../components/memAndJvm/index.vue";
import CpuChart from "../components/cpuChart/index.vue";

// 服务器监控数据
const server = ref({});
const { proxy } = getCurrentInstance();

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

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
/* 组件样式已移至子组件中 */
</style>
