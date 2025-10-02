<template>
  <div class="messageContainer" :style="styleObject">
    <div class="scroll-view" ref="scrollViewRef">
      <div ref="listRef">
        <div
          class="item"
          v-for="(item, index) in doubledList"
          :key="`i-${index}`"
          :style="{
            background: gradients.length
              ? gradients[index % gradients.length]
              : 'transparent',
            color: colors.length ? colors[index % colors.length] : '#000',
          }"
        >
          <img v-if="item.avatar" :src="item.avatar" :alt="item.alt || ''" />
          <div v-else class="default-avatar">
            <el-icon><User /></el-icon>
          </div>
          <div>{{ item.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import type { Ref } from "vue";
import { User } from "@element-plus/icons-vue";

type MessageItem = {
  avatar?: string;
  alt?: string;
  message?: string;
  type?: string;
  defineColors?: { bgColor?: string; txtColor?: string };
};

const props = withDefaults(
  defineProps<{
    height?: string | number;
    width?: string | number;
    objList?: MessageItem[];
    speed?: number;
  }>(),
  {
    height: 400,
    width: 400,
    objList: () => [],
    speed: 1,
  }
);

function toCssSize(v?: string | number) {
  if (v == null) return "";
  if (typeof v === "number") return `${v}px`;
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return `${s}px`;
  return s;
}

const styleObject = computed(() => ({
  height: toCssSize(props.height),
  width: toCssSize(props.width),
  cursor: "default",
}));

const bgColors = computed(() => {
  return (props.objList || []).map((item) => {
    if (item && item.defineColors)
      return item.defineColors.bgColor || "rgb(244, 244, 245)";
    switch (item?.type) {
      case "primary":
        return "rgb(236, 245, 255)";
      case "success":
        return "rgb(240, 249, 235)";
      case "warning":
        return "rgb(253, 246, 236)";
      case "danger":
        return "rgb(254, 240, 240)";
      case "info":
        return "rgb(244, 244, 245)";
      default:
        return "rgb(244, 244, 245)";
    }
  });
});

const colors = computed(() => {
  return (props.objList || []).map((item) => {
    if (item && item.defineColors?.txtColor)
      return item.defineColors.txtColor || "#909399";
    switch (item?.type) {
      case "primary":
        return "#409EFF";
      case "success":
        return "#67C23A";
      case "warning":
        return "#E6A23C";
      case "danger":
        return "#F56C6C";
      case "info":
        return "#909399";
      default:
        return "#909399";
    }
  });
});

const gradients = computed(() =>
  bgColors.value.map(
    (c) => `linear-gradient(180deg, transparent 0%, ${c} 100%)`
  )
);

const doubledList = computed(() => {
  const list = props.objList || [];
  return list.length > 0 ? [...list, ...list] : [];
});

const scrollViewRef: Ref<HTMLElement | null> = ref(null);
const listRef: Ref<HTMLElement | null> = ref(null);
let animationFrameId: number | null = null;
let lastTime = 0;

const scrollSpeed = computed(() => Math.max(0, Number(props.speed) || 1));

const autoScroll = (timestamp: number) => {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  const scrollView = scrollViewRef.value;
  const list = listRef.value;
  if (!scrollView || !list) return;

  const scrollDistance = (scrollSpeed.value / 16) * deltaTime;
  scrollView.scrollTop += scrollDistance;
  const resetPosition = list.offsetHeight / 2;
  if (scrollView.scrollTop >= resetPosition) scrollView.scrollTop = 0;

  animationFrameId = requestAnimationFrame(autoScroll);
};

const startScroll = () => {
  if (animationFrameId != null) cancelAnimationFrame(animationFrameId);
  lastTime = 0;
  animationFrameId = requestAnimationFrame(autoScroll);
};

const stopScroll = () => {
  if (animationFrameId != null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

onMounted(() => {
  nextTick(() => {
    startScroll();
  });
});

onBeforeUnmount(() => {
  stopScroll();
});
</script>

<style lang="scss" scoped>
.messageContainer {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 10px;
}
.scroll-view {
  flex: 1;
  height: 0;
  width: 100%;
  overflow-y: auto;
}
.item {
  width: 100%;
  border-radius: 5px;
  font-size: 14px;
  display: flex;
  align-items: center;
  margin: 10px 0;
  line-height: 20px;
  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin: 5px 10px 5px 5px;
  }
  .default-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin: 5px 10px 5px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.scroll-view::-webkit-scrollbar {
  display: none;
}
</style>
