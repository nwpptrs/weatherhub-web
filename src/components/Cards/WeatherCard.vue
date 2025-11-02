<script setup>
import { computed } from "vue";
import {
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  SunMedium,
  CloudFog,
  CloudLightning,
} from "lucide-vue-next";

const CONDITIONS = {
  0: { icon: Sun, text: "แจ่มใส" },
  1: { icon: SunMedium, text: "แจ่มใสเป็นส่วนใหญ่" },
  2: { icon: SunMedium, text: "มีเมฆเป็นบางส่วน" },
  3: { icon: Cloud, text: "มีเมฆมาก" },
  45: { icon: CloudFog, text: "หมอก" },
  48: { icon: CloudFog, text: "หมอกน้ำแข็ง" },
  51: { icon: CloudDrizzle, text: "ฝนปรอยเบา" },
  53: { icon: CloudDrizzle, text: "ฝนปรอยปานกลาง" },
  55: { icon: CloudDrizzle, text: "ฝนปรอยหนัก" },
  61: { icon: CloudRain, text: "ฝนตกเบา" },
  63: { icon: CloudRain, text: "ฝนตกปานกลาง" },
  65: { icon: CloudRain, text: "ฝนตกหนัก" },
  71: { icon: CloudSnow, text: "หิมะตกเบา" },
  73: { icon: CloudSnow, text: "หิมะตกปานกลาง" },
  75: { icon: CloudSnow, text: "หิมะตกหนัก" },
  80: { icon: CloudRain, text: "ฝนตกเป็นช่วงๆ" },
  81: { icon: CloudRain, text: "ฝนตกเป็นช่วงๆ" },
  82: { icon: CloudRain, text: "ฝนตกหนักเป็นช่วงๆ" },
  95: { icon: CloudLightning, text: "พายุฝนฟ้าคะนอง" },
  96: { icon: CloudLightning, text: "พายุลูกเห็บ" },
  99: { icon: CloudLightning, text: "พายุลูกเห็บหนัก" },
};

const props = defineProps({
  city: String,
  temperature: Number,
  humidity: Number,
  windSpeed: Number,
  rain: Number,
  conditionCode: Number,
  lastUpdated: String,
});

const numericCode = computed(() => {
  const code = parseInt(props.conditionCode);
  return isNaN(code) ? null : code;
});

const weatherIcon = computed(() => {
  const code = numericCode.value;
  return CONDITIONS[code] ? CONDITIONS[code].icon : Cloud;
});

const conditionText = computed(() => {
  const code = numericCode.value;

  if (code === null) return "ไม่มีข้อมูลสภาพท้องฟ้า";

  return CONDITIONS[code] ? CONDITIONS[code].text : "รหัสสภาพอากาศไม่รู้จัก";
});
</script>

<template>
  <div
    class="border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 h-full transform hover:shadow-xl transition-shadow duration-300"
  >
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between">
        <span class="text-3xl font-semibold">{{ props.city || "N/A" }}</span>
        <component
          :is="weatherIcon"
          class="h-12 w-12 text-blue-500 dark:text-blue-300"
        />
      </div>
    </div>
    <div class="p-6 md:p-8 space-y-6">
      <div>
        <div
          class="text-6xl md:text-7xl font-extrabold text-blue-600 dark:text-blue-400"
        >
          {{
            props.temperature != null ? Math.round(props.temperature) : "N/A"
          }}°C
        </div>
        <div class="text-lg text-gray-600 dark:text-gray-300 mt-2">
          {{ conditionText }}
        </div>
      </div>

      <div
        class="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex flex-col items-center gap-1">
          <Droplets class="h-6 w-6 text-gray-500 dark:text-gray-300" />
          <span class="text-lg font-medium">
            {{
              props.humidity != null ? `${Math.round(props.humidity)}%` : "N/A"
            }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">ความชื้น</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Wind class="h-6 w-6 text-gray-500 dark:text-gray-300" />
          <span class="text-lg font-medium">
            {{
              props.windSpeed != null
                ? `${props.windSpeed.toFixed(1)} m/s`
                : "N/A"
            }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400"
            >ความเร็วลม</span
          >
        </div>
        <div class="flex flex-col items-center gap-1">
          <CloudRain class="h-6 w-6 text-gray-500 dark:text-gray-300" />
          <span class="text-lg font-medium">
            {{ props.rain != null ? `${props.rain.toFixed(1)} mm` : "N/A" }}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">ปริมาณฝน</span>
        </div>
      </div>

      <div
        class="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        อัปเดตล่าสุด: {{ props.lastUpdated || "ไม่มีข้อมูลเวลา" }}
      </div>
    </div>
  </div>
</template>
