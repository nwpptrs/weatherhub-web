<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import weatherApi from "../api/weather.vue";
import locationApi from "../api/locations.vue";
import { Loader, AlertTriangle } from "lucide-vue-next";

import { Line as LineChart, Bar as BarChart } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement
);

const THAI_TIMEZONE = "Asia/Bangkok";
const CHART_FONT_DARK = "#d1d5db";
const CHART_FONT_LIGHT = "#4b5563";
const CHART_GRID_DARK = "rgba(107, 114, 128, 0.2)";
const CHART_GRID_LIGHT = "rgba(0, 0, 0, 0.1)";

const allLocations = ref([]);
const selectedCity1 = ref(null);
const selectedCity2 = ref(null);

const isLoading = ref(false);
const errorCity1 = ref(null);
const errorCity2 = ref(null);

const hourlyData1 = ref(null);
const dailyData1 = ref(null);
const hourlyData2 = ref(null);
const dailyData2 = ref(null);

const isDarkMode = ref(document.documentElement.classList.contains("dark"));
let abortController = null;

const fetchAllLocations = async () => {
  try {
    const res = await locationApi.getAll();
    allLocations.value = res.data;
  } catch (err) {
    console.error("Failed to fetch locations:", err);
  }
};

const fetchSingleCityData = async (
  city,
  hourlyRef,
  dailyRef,
  errorRef,
  signal
) => {
  if (!city) return;
  try {
    const [hourlyRes, dailyRes] = await Promise.all([
      weatherApi.getHourly(city.id, { signal }),
      weatherApi.getDaily(city.id, { signal }),
    ]);
    hourlyRef.value = hourlyRes.data;
    dailyRef.value = dailyRes.data;
    errorRef.value = null;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(`Error fetching data for ${city.name}:`, error);
      hourlyRef.value = null;
      dailyRef.value = null;
      errorRef.value = city.name;
    }
  }
};

onMounted(() => {
  fetchAllLocations();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        isDarkMode.value = document.documentElement.classList.contains("dark");
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });

  onBeforeUnmount(() => observer.disconnect());
});

watch([selectedCity1, selectedCity2], async () => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  [hourlyData1, dailyData1, hourlyData2, dailyData2].forEach(
    (r) => (r.value = null)
  );
  [errorCity1, errorCity2].forEach((r) => (r.value = null));

  const city1 = selectedCity1.value;
  const city2 = selectedCity2.value;

  if (!city1 && !city2) return;

  isLoading.value = true;

  const city1Promise = fetchSingleCityData(
    city1,
    hourlyData1,
    dailyData1,
    errorCity1,
    signal
  );
  const city2Promise = fetchSingleCityData(
    city2,
    hourlyData2,
    dailyData2,
    errorCity2,
    signal
  );

  try {
    await Promise.all([city1Promise, city2Promise]);
  } catch (e) {
    if (e.name === "AbortError") return;
    console.error("Unknown error in Promise.all:", e);
  } finally {
    isLoading.value = false;
    abortController = null;
  }
});

const isCitiesSelected = computed(() => {
  return selectedCity1.value && selectedCity2.value;
});

const isDataReady = computed(() => {
  const hasData =
    hourlyData1.value ||
    hourlyData2.value ||
    dailyData1.value ||
    dailyData2.value;
  const noFatalError = !errorCity1.value && !errorCity2.value;
  return isCitiesSelected.value && hasData && noFatalError;
});

const chartColors = computed(() => ({
  font: isDarkMode.value ? CHART_FONT_DARK : CHART_FONT_LIGHT,
  grid: isDarkMode.value ? CHART_GRID_DARK : CHART_GRID_LIGHT,
  primary: isDarkMode.value ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)",
  secondary: isDarkMode.value ? "rgb(248, 113, 113)" : "rgb(239, 68, 68)",
}));

const createBaseChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: chartColors.value.font,
      },
    },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: {
      ticks: { color: chartColors.value.font },
      grid: { color: chartColors.value.grid },
    },
    y: {
      ticks: { color: chartColors.value.font },
      grid: { color: chartColors.value.grid },
    },
  },
}));

const createHourlyTemperatureDataset = computed(() => {
  const timeLabels = hourlyData1.value?.time ?? hourlyData2.value?.time ?? [];
  if (timeLabels.length === 0) return [];

  const timezone = selectedCity1.value?.timezone || THAI_TIMEZONE;

  return timeLabels.map((time, index) => ({
    time: new Date(time).toLocaleTimeString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }),
    city1: hourlyData1.value?.temperature_2m?.[index] ?? null,
    city2: hourlyData2.value?.temperature_2m?.[index] ?? null,
  }));
});

const temperatureChartData = computed(() => {
  const combinedData = createHourlyTemperatureDataset.value;
  return {
    labels: combinedData.map((d) => d.time),
    datasets: [
      {
        label: selectedCity1.value?.name || "City A",
        data: combinedData.map((d) => d.city1),
        borderColor: chartColors.value.primary,
        backgroundColor: chartColors.value.primary
          .replace("rgb", "rgba")
          .replace(")", ", 0.5)"),
        tension: 0.3,
        hidden: !hourlyData1.value,
        spanGaps: true,
      },
      {
        label: selectedCity2.value?.name || "City B",
        data: combinedData.map((d) => d.city2),
        borderColor: chartColors.value.secondary,
        backgroundColor: chartColors.value.secondary
          .replace("rgb", "rgba")
          .replace(")", ", 0.5)"),
        tension: 0.3,
        hidden: !hourlyData2.value,
        spanGaps: true,
      },
    ].filter((d) => !d.hidden),
  };
});

const tempOptions = computed(() => ({
  ...createBaseChartOptions.value,
  plugins: {
    ...createBaseChartOptions.value.plugins,
    title: {
      display: true,
      text: "เปรียบเทียบอุณหภูมิรายชั่วโมง",
      color: chartColors.value.font,
    },
    tooltip: {
      ...createBaseChartOptions.value.plugins.tooltip,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} °C`,
      },
    },
  },
  scales: {
    ...createBaseChartOptions.value.scales,
    y: {
      ...createBaseChartOptions.value.scales.y,
      title: {
        display: true,
        text: "อุณหภูมิ (°C)",
        color: chartColors.value.font,
      },
      beginAtZero: false,
    },
    x: {
      ...createBaseChartOptions.value.scales.x,
      title: {
        display: true,
        text: "วัน / เวลา",
        color: chartColors.value.font,
      },
      ticks: {
        display: false,
        color: chartColors.value.font,
      },
    },
  },
}));

const createDailyRainfallDataset = computed(() => {
  const dayLabels = dailyData1.value?.time ?? dailyData2.value?.time ?? [];
  if (dayLabels.length === 0) return [];

  const timezone = selectedCity1.value?.timezone || THAI_TIMEZONE;

  return dayLabels.map((dayIso, index) => {
    const d = new Date(dayIso + "T00:00:00Z");

    return {
      day: d.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        timeZone: timezone,
      }),
      city1: dailyData1.value?.precipitation_sum?.[index] ?? null,
      city2: dailyData2.value?.precipitation_sum?.[index] ?? null,
    };
  });
});

const rainfallChartData = computed(() => {
  const combinedData = createDailyRainfallDataset.value;
  return {
    labels: combinedData.map((d) => d.day),
    datasets: [
      {
        label: selectedCity1.value?.name || "City A",
        data: combinedData.map((d) => d.city1),
        backgroundColor: chartColors.value.primary,
        borderColor: chartColors.value.primary,
        hidden: !dailyData1.value,
      },
      {
        label: selectedCity2.value?.name || "City B",
        data: combinedData.map((d) => d.city2),
        backgroundColor: chartColors.value.secondary,
        borderColor: chartColors.value.secondary,
        hidden: !dailyData2.value,
      },
    ].filter((d) => !d.hidden),
  };
});

const rainOptions = computed(() => ({
  ...createBaseChartOptions.value,
  plugins: {
    ...createBaseChartOptions.value.plugins,
    title: {
      display: true,
      text: "เปรียบเทียบปริมาณฝนรายวัน",
      color: chartColors.value.font,
    },
    tooltip: {
      ...createBaseChartOptions.value.plugins.tooltip,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} mm`,
      },
    },
  },
  scales: {
    ...createBaseChartOptions.value.scales,
    y: {
      ...createBaseChartOptions.value.scales.y,
      title: {
        display: true,
        text: "ปริมาณฝน (mm)",
        color: chartColors.value.font,
      },
      beginAtZero: true,
    },
    x: {
      ...createBaseChartOptions.value.scales.x,
      title: {
        display: true,
        text: "วัน / เดือน",
        color: chartColors.value.font,
      },
    },
  },
}));
</script>

<template>
  <div
    class="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors"
  >
    <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
      เทียบสภาพอากาศ (Weather Comparison)
    </h1>

    <div
      class="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md transition-colors"
    >
      <select
        v-model="selectedCity1"
        class="p-3 border border-blue-400 dark:border-blue-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 flex-1 transition"
        :class="{ 'bg-blue-50/50 dark:bg-blue-900/50': selectedCity1 }"
      >
        <option :value="null" disabled>เลือกเมืองที่ 1</option>
        <option v-for="loc in allLocations" :key="loc.id" :value="loc">
          {{ loc.name }}
        </option>
      </select>

      <span
        class="text-2xl text-gray-400 dark:text-gray-500 self-center hidden md:block"
        >VS</span
      >

      <select
        v-model="selectedCity2"
        class="p-3 border border-red-400 dark:border-red-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-red-500 flex-1 transition"
        :class="{ 'bg-red-50/50 dark:bg-red-900/50': selectedCity2 }"
      >
        <option :value="null" disabled>เลือกเมืองที่ 2</option>
        <option v-for="loc in allLocations" :key="loc.id" :value="loc">
          {{ loc.name }}
        </option>
      </select>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center p-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-64 transition-colors"
    >
      <Loader class="h-10 w-10 text-blue-500 animate-spin" />
      <p class="mt-4 text-lg text-blue-600 dark:text-blue-400">
        กำลังโหลดข้อมูลเปรียบเทียบ...
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        อาจใช้เวลาสักครู่ในการดึงข้อมูล 7 วัน
      </p>
    </div>

    <div
      v-else-if="errorCity1 || errorCity2"
      class="flex flex-col items-center justify-center p-16 bg-red-50 dark:bg-red-900 rounded-lg border border-red-300 dark:border-red-700 h-64 transition-colors"
    >
      <AlertTriangle class="h-10 w-10 text-red-600 dark:text-red-400" />
      <p
        class="mt-4 text-red-600 dark:text-red-400 text-lg font-medium text-center"
      >
        🚨 ไม่สามารถโหลดข้อมูลได้
      </p>
      <p class="text-sm text-red-500 dark:text-red-300 mt-2">
        พบปัญหาในการดึงข้อมูลสำหรับ:
        <span v-if="errorCity1" class="font-bold"
          >{{ errorCity1 }} (City A)</span
        >
        <span v-if="errorCity1 && errorCity2"> และ </span>
        <span v-if="errorCity2" class="font-bold"
          >{{ errorCity2 }} (City B)</span
        >
      </p>
    </div>

    <div
      v-else-if="!isCitiesSelected"
      class="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-64 flex flex-col items-center justify-center transition-colors"
    >
      <AlertTriangle
        class="h-8 w-8 text-yellow-500 dark:text-yellow-400 mb-2"
      />
      <p class="text-lg text-gray-600 dark:text-gray-300 font-medium">
        โปรดเลือก 2 เมือง เพื่อเริ่มต้นการเปรียบเทียบ
      </p>
    </div>

    <div v-else-if="isDataReady" class="grid gap-6 md:grid-cols-2">
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transition-colors"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            🌡️ อุณหภูมิรายชั่วโมง
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ข้อมูลรายชั่วโมงย้อนหลัง 7 วัน
          </p>
        </div>
        <div class="p-4">
          <div class="h-[300px] w-full">
            <LineChart
              v-if="temperatureChartData.datasets.length > 0"
              :data="temperatureChartData"
              :options="tempOptions"
            />
            <div
              v-else
              class="text-center p-16 text-gray-500 dark:text-gray-400"
            >
              ไม่พบข้อมูลอุณหภูมิรายชั่วโมงสำหรับการเปรียบเทียบ
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transition-colors"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            🌧️ ปริมาณฝนรายวัน
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            ปริมาณฝนรวมรายวันย้อนหลัง 7 วัน
          </p>
        </div>
        <div class="p-4">
          <div class="h-[300px] w-full">
            <BarChart
              v-if="rainfallChartData.datasets.length > 0"
              :data="rainfallChartData"
              :options="rainOptions"
            />
            <div
              v-else
              class="text-center p-16 text-gray-500 dark:text-gray-400"
            >
              ไม่พบข้อมูลปริมาณฝนรายวันสำหรับการเปรียบเทียบ
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
