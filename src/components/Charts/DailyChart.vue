<script setup>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  BarElement,
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
  BarElement,
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
  fetchDailyData();

  watch(
    () => props.locationId,
    (newId, oldId) => {
      if (newId !== oldId) fetchDailyData();
    }
  );
  onUnmounted(() => observer.disconnect());
});

const chartOptions = computed(() => {
  const textColor = isDarkMode.value ? "#ffffff" : "#000000";
  const gridColorPrimary = isDarkMode.value
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
        text: "สรุปพยากรณ์รายวัน",
        color: textColor,
      },
      tooltip: {
        titleColor: textColor,
        bodyColor: textColor,
        backgroundColor: isDarkMode.value ? "#111" : "#fff",
        callbacks: {
          label: (ctx) => {
            let unit = ctx.dataset.label.includes("°C") ? " °C" : " mm";
            return `${ctx.dataset.label}: ${ctx.formattedValue}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "วัน / เดือน", color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColorPrimary },
      },
      "y-temp": {
        position: "left",
        title: { display: true, text: "อุณหภูมิ (°C)", color: textColor },
        ticks: { color: textColor },
        beginAtZero: false,
        grid: { drawOnChartArea: true, color: gridColorPrimary },
      },
      "y-rain": {
        position: "right",
        title: { display: true, text: "ปริมาณฝน (mm)", color: textColor },
        ticks: { color: textColor },
        beginAtZero: true,
        suggestedMin: 0,
        suggestedMax: 20,
        grid: { drawOnChartArea: false },
      },
    },
  };
});

const fetchDailyData = async () => {
  loading.value = true;
  chartError.value = null;
  chartData.value = null;

  try {
    const res = await weatherApi.getDaily(props.locationId);
    const data = res.data;

    if (!data || !data.time || data.time.length === 0) {
      throw new Error("ไม่พบข้อมูลรายวันสำหรับพยากรณ์");
    }

    chartData.value = {
      labels: data.time.map((t) => {
        const [year, month, day] = t.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
        });
      }),
      datasets: [
        {
          label: "อุณหภูมิสูงสุด (°C)",
          backgroundColor: "#f87171",
          data: data.temperature_max,
          yAxisID: "y-temp",
        },
        {
          label: "อุณหภูมิต่ำสุด (°C)",
          backgroundColor: "#60a5fa",
          data: data.temperature_min,
          yAxisID: "y-temp",
        },
        {
          label: "ปริมาณฝนรวม (mm)",
          backgroundColor: "#34d399",
          data: data.precipitation_sum,
          yAxisID: "y-rain",
        },
      ],
    };
  } catch (err) {
    console.error("Error fetching daily data:", err);
    chartError.value = err.message || "ไม่สามารถโหลดข้อมูลสรุปรายวันได้";
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
    <Bar
      v-else-if="chartData && chartData.labels.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>
