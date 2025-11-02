<script setup>
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import weatherApi from "../../api/weather.vue";
import { AlertTriangle } from "lucide-vue-next";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  locationId: Number,
  timezone: String,
});

const chartData = ref(null);
const loading = ref(true);
const chartError = ref(null);
const isDarkMode = ref(document.documentElement.classList.contains("dark"));

const handleThemeChange = () => {
  isDarkMode.value = document.documentElement.classList.contains("dark");
};

onMounted(() => {
  const observer = new MutationObserver(handleThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  onUnmounted(() => observer.disconnect());
  fetchHourlyData();

  watch(
    () => props.locationId,
    (newId, oldId) => {
      if (newId !== oldId) fetchHourlyData();
    }
  );
});

const chartOptions = computed(() => {
  const textColor = isDarkMode.value ? "#ffffff" : "#000000";
  const gridColor = isDarkMode.value
    ? "rgba(255,255,255,0.15)"
    : "rgba(0,0,0,0.1)";

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: textColor },
      },
      title: {
        display: true,
        text: "กราฟรายชั่วโมง (ย้อนหลัง 7 วัน)",
        color: textColor,
      },
      tooltip: {
        titleColor: textColor,
        bodyColor: textColor,
        backgroundColor: isDarkMode.value ? "#111" : "#fff",
      },
    },
    scales: {
      x: {
        title: { display: true, text: "วัน / เวลา", color: textColor },
        ticks: {
          color: textColor,
          autoSkip: false,
          callback: function (value, index) {
            return "";
          },
        },
        grid: { color: gridColor },
      },
      y: {
        title: {
          display: true,
          text: "ค่า (°C, %, m/s, mm)",
          color: textColor,
        },
        ticks: { color: textColor },
        grid: { color: gridColor },
        beginAtZero: true,
      },
    },
  };
});

const fetchHourlyData = async () => {
  loading.value = true;
  chartError.value = null;
  chartData.value = null;

  try {
    const res = await weatherApi.getHourly(props.locationId);
    const data = res.data;

    if (!data || !data.time || data.time.length === 0) {
      throw new Error("ไม่พบข้อมูลรายชั่วโมงที่สมบูรณ์");
    }

    chartData.value = {
      labels: data.time.map((t) => {
        const d = new Date(t);
        return d.toLocaleString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: props.timezone,
        });
      }),
      datasets: [
        {
          label: "อุณหภูมิ (°C)",
          data: data.temperature_2m,
          borderColor: "#f87171",
          tension: 0.3,
          fill: false,
        },
        {
          label: "ความชื้น (%)",
          data: data.relative_humidity_2m,
          borderColor: "#60a5fa",
          tension: 0.3,
          fill: false,
        },
        {
          label: "ความเร็วลม (m/s)",
          data: data.windspeed_10m,
          borderColor: "#34d399",
          tension: 0.3,
          fill: false,
        },
        {
          label: "ฝน (mm)",
          data: data.precipitation,
          borderColor: "#818cf8",
          tension: 0.3,
          fill: false,
        },
      ],
    };
  } catch (err) {
    console.error("Error fetching hourly data:", err);
    chartError.value = err.message || "ไม่สามารถโหลดข้อมูลรายชั่วโมงได้";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="h-[400px] w-full transition-colors duration-300 relative">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 z-10"
    >
      <p class="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
    </div>
    <div
      v-else-if="chartError"
      class="absolute inset-0 flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-300 z-10"
    >
      <AlertTriangle class="h-8 w-8" />
      <p class="mt-2 text-sm text-center">
        **เกิดข้อผิดพลาดในการโหลดข้อมูล:** {{ chartError }}
      </p>
    </div>
    <Line v-else-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>
