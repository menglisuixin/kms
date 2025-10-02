// src/utils/cron.js
function isValidField(val, min, max, fieldName) {
  if (!val || val.trim() === "") return false;
  const parts = val.split(",").filter((p) => p.trim() !== "");
  if (parts.length === 0) return false;

  for (let raw of parts) {
    let p = raw;

    // 将英文月份/周名转换为数字（支持 JAN, January, MON, Monday 等常见写法的前三字母），
    // 方便后续统一按数字校验和解析。
    p = p.replace(/[A-Za-z]{3,}/g, (m) => {
      const n = nameToNumber(m, fieldName);
      return n != null ? String(n) : m;
    });

    // 基础通配符
    if (["*", "?"].includes(p)) continue;

    // L 支持 (L, L-3, 5L)
    if (/^L(-\d+)?$/.test(p) || /^\d+L$/.test(p)) {
      if (fieldName === "周" && /^\d+L$/.test(p)) {
        const day = parseInt(p.replace("L", ""), 10);
        if (isNaN(day) || day < 1 || day > 7) return false;
      }
      if (fieldName === "日" && /^L(-\d+)?$/.test(p)) {
        // L 或 L-3 等，允许 L 本身（offset 0）或负数偏移（如 L-3）
        const offset = p === "L" ? 0 : parseInt(p.replace("L", ""), 10);
        if (isNaN(offset)) return false;
        if (offset > 0) return false; // 不能是正数偏移
        if (Math.abs(offset) >= max) return false;
      }
      continue;
    }

    // W 支持 (5W)
    if (/^\d+W$/.test(p)) {
      if (fieldName !== "日") return false;
      const day = parseInt(p.replace("W", ""), 10);
      if (isNaN(day) || day < 1 || day > 31) return false;
      continue;
    }

    // # 支持 (3#2)
    if (/^\d+#\d+$/.test(p)) {
      if (fieldName !== "周") return false;
      const [day, nth] = p.split("#").map(Number);
      if (isNaN(day) || isNaN(nth) || day < 1 || day > 7 || nth < 1 || nth > 5)
        return false;
      continue;
    }

    // 步长 /
    if (p.includes("/")) {
      const [start, step] = p.split("/");
      if (!isStarOrValidNum(start, min, max)) return false;
      if (!isPositiveInt(step)) return false;
      continue;
    }

    // 范围 -
    if (p.includes("-")) {
      const [start, end] = p.split("-");
      if (!isValidNum(start, min, max) || !isValidNum(end, min, max))
        return false;
      if (parseInt(start, 10) > parseInt(end, 10)) return false;
      continue;
    }

    // 单个数字
    if (!isValidNum(p, min, max)) return false;
  }
  return true;
}

function parseToText(
  val,
  unit,
  min,
  max,
  names = null,
  isDefaultSecond = false
) {
  if (val === "*") return "";
  if (val === "?") return "";
  if (isDefaultSecond && val === "0") return "";
  const parts = val.split(",").map((raw) => {
    let p = raw;

    // 将名称替换为数字以便统一处理（如 MON -> 1, JAN -> 1）
    p = p.replace(/[A-Za-z]{3,}/g, (m) => {
      const n = nameToNumber(
        m,
        unit === "月" ? "月" : unit === "周" ? "周" : null
      );
      return n != null ? String(n) : m;
    });

    // L
    if (p === "L") {
      return unit === "日" ? "每月最后一天" : "每周最后一天";
    }
    if (/^L(-\d+)$/.test(p)) {
      const offset = parseInt(p.replace("L", ""), 10);
      return `每月倒数第${Math.abs(offset)}天`;
    }
    if (/^\d+L$/.test(p)) {
      const day = parseInt(p.replace("L", ""), 10);
      const weekdayNames = [
        "周日",
        "周一",
        "周二",
        "周三",
        "周四",
        "周五",
        "周六",
      ];
      return `每月最后一个${weekdayNames[day === 7 ? 0 : day]}`;
    }

    // W
    if (/^\d+W$/.test(p)) {
      const day = parseInt(p.replace("W", ""), 10);
      return `每月${day}日最近的工作日`;
    }

    // #
    if (/^\d+#\d+$/.test(p)) {
      const [day, nth] = p.split("#").map(Number);
      const weekdayNames = [
        "周日",
        "周一",
        "周二",
        "周三",
        "周四",
        "周五",
        "周六",
      ];
      return `每月第${nth}个${weekdayNames[day === 7 ? 0 : day]}`;
    }

    // 步长 /
    if (p.includes("/")) {
      const [start, step] = p.split("/");
      const stepNum = parseInt(step, 10);
      if (unit === "秒" && start === "0") return `每${stepNum}秒`;
      if (start === "*" || start === String(min)) return `每${stepNum}${unit}`;
      return `${start}${unit}开始，每${stepNum}${unit}`;
    }

    // 范围 -
    if (p.includes("-")) {
      const [start, end] = p.split("-");
      // 处理周的 7 -> 0 映射
      const sNum = parseInt(start, 10);
      const eNum = parseInt(end, 10);
      const startIdx = names
        ? unit === "月"
          ? sNum - 1
          : unit === "周"
          ? sNum === 7
            ? 0
            : sNum
          : sNum
        : null;
      const endIdx = names
        ? unit === "月"
          ? eNum - 1
          : unit === "周"
          ? eNum === 7
            ? 0
            : eNum
          : eNum
        : null;
      const startDesc = names ? names[startIdx] : `${start}${unit}`;
      const endDesc = names ? names[endIdx] : `${end}${unit}`;
      return `${startDesc}至${endDesc}`;
    }

    // 单个数字或名字（已在上面转换为数字）
    if (names) {
      let idx = parseInt(p, 10) - (unit === "月" ? 1 : 0);
      if (unit === "周") {
        // 将 7 映射到 0（周日）
        const rawNum = parseInt(p, 10);
        if (rawNum === 7) idx = 0;
      }
      return names[idx] || `${p}${unit}`;
    }
    return `${p}${unit}`;
  });

  return parts.join("、");
}

export default function translateCron(cron) {
  cron = (cron || "").trim();
  if (!cron) return "请提供cron表达式";

  let parts = cron.split(/\s+/).filter((x) => x);
  if (parts.length === 7) parts.pop(); // 移除年
  if (parts.length !== 6)
    return "错误：cron表达式必须包含6个字段（秒 分 时 日 月 周）";

  const [secStr, minStr, hourStr, domStr, monStr, dowStr] = parts;

  const validators = [
    { field: "秒", val: secStr, min: 0, max: 59 },
    { field: "分", val: minStr, min: 0, max: 59 },
    { field: "时", val: hourStr, min: 0, max: 23 },
    { field: "日", val: domStr, min: 1, max: 31 },
    { field: "月", val: monStr, min: 1, max: 12 },
    { field: "周", val: dowStr, min: 0, max: 7 },
  ];

  for (const v of validators) {
    if (!isValidField(v.val, v.min, v.max, v.field)) {
      return `错误：${v.field}字段格式不正确 - ${v.val}`;
    }
  }

  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];
  const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const secDesc = parseToText(secStr, "秒", 0, 59, null, secStr === "0");
  const minDesc = parseToText(minStr, "分", 0, 59);
  const hourDesc = parseToText(hourStr, "时", 0, 23);
  const domDesc = parseToText(domStr, "日", 1, 31);
  const monDesc = parseToText(monStr, "月", 1, 12, monthNames);
  const dowDesc = parseToText(dowStr, "周", 0, 7, weekdayNames);

  let timeDesc = "";
  if (secDesc.includes("每") && secDesc.includes("秒")) {
    timeDesc = secDesc;
  } else if (
    minDesc.includes("每") &&
    minDesc.includes("分") &&
    secStr === "0"
  ) {
    timeDesc = minDesc.replace("分", "分钟");
  } else {
    const timeParts = [hourDesc, minDesc, secDesc].filter(Boolean);
    timeDesc = timeParts.length ? timeParts.join("") : "整点";
  }

  const dayParts = [];
  if (domDesc) dayParts.push(domDesc);
  if (dowDesc) dayParts.push(dowDesc);
  const dayDesc = dayParts.length
    ? dayParts.length === 1
      ? dayParts[0]
      : `(${dayParts.join("或")})`
    : "每天";

  const periodParts = [];
  if (monDesc) periodParts.push(monDesc);
  if (dayDesc !== "每天") periodParts.push(dayDesc);
  const periodDesc = periodParts.join("，");

  return periodDesc
    ? `${periodDesc} ${timeDesc}执行一次`
    : `${timeDesc}执行一次`;
}

// 辅助函数
function isNonNegativeInt(str) {
  return /^\d+$/.test(str) && parseInt(str, 10) >= 0;
}
function isPositiveInt(str) {
  return /^\d+$/.test(str) && parseInt(str, 10) > 0;
}
function isValidNum(str, min, max) {
  if (!isNonNegativeInt(str)) return false;
  const num = parseInt(str, 10);
  return num >= min && num <= max;
}
function isStarOrValidNum(str, min, max) {
  if (str === "*") return true;
  return isValidNum(str, min, max);
}

// 把英文月份/周名（最常见的前三字母）映射成数字，以便统一解析。
function nameToNumber(name, fieldName) {
  if (!name) return null;
  const key = name.toLowerCase().slice(0, 3);
  const months = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  const weeks = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 7,
  };

  if (fieldName === "月") {
    return months[key] || null;
  }
  if (fieldName === "周") {
    // 我们采用文件中已有的约定：1..7 表示 周一..周日（7 映射到周日）
    return weeks[key] || null;
  }
  // 当 fieldName 未明确传入时，尝试两种映射中的任意一个
  return months[key] || weeks[key] || null;
}
