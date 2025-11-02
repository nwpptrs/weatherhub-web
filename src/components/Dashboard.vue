<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import WeatherCard from "../components/Cards/WeatherCard.vue";
import HourlyChart from "../components/Charts/HourlyChart.vue";
import DailyChart from "../components/Charts/DailyChart.vue";
import weatherApi from "../api/weather.vue";
import locationApi from "../api/locations.vue";
import { Loader, AlertTriangle, Search } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const locations = ref([]);
const weather = ref(null);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref("");
const showDropdown = ref(false);

const searchInput = ref(null);
const dropdownWrapper = ref(null);

const filteredLocations = computed(() => {
  if (!searchQuery.value.trim()) return locations.value;
  return locations.value.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const fetchLocations = async () => {
  error.value = null;
  try {
    const res = await locationApi.getAll();
    locations.value = res.data;
  } catch (err) {
    console.error(err);
    error.value = "ไม่สามารถโหลดรายชื่อเมืองได้";
  }
};

const fetchWeatherByCity = async (loc) => {
  if (!loc) return;
  searchQuery.value = loc.name;
  showDropdown.value = false;

  loading.value = true;
  error.value = null;
  weather.value = null;

  try {
    const res = await weatherApi.getLatest(loc.id);
    const data = res.data.data;
    if (!data || !data.timestamp)
      throw new Error("No recent weather data available.");

    weather.value = {
      ...data,
      conditionCode: data.condition,
      city: loc.name,
      timezone: loc.timezone,
      location_id: loc.id,
    };

    router.replace({
      query: {
        location_id: loc.id,
      },
    });
  } catch (err) {
    console.error(err);
    error.value = err.message.includes("No recent weather")
      ? `ไม่พบข้อมูลสภาพอากาศล่าสุดสำหรับ ${loc.name}`
      : "ไม่สามารถโหลดข้อมูลสภาพอากาศได้";
    weather.value = null;
  } finally {
    loading.value = false;
  }
};

const handleFocus = () => {
  showDropdown.value = true;
};

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

onMounted(async () => {
  loading.value = true;
  await fetchLocations();

  let targetLocation = null;

  const urlLocationId = route.query.location_id;

  if (locations.value.length) {
    if (urlLocationId) {
      targetLocation = locations.value.find(
        (l) => l.id === parseInt(urlLocationId)
      );
    }

    if (!targetLocation) {
      targetLocation = locations.value[0];

      router
        .replace({ query: { location_id: targetLocation.id } })
        .catch(() => {});
    }

    await fetchWeatherByCity(targetLocation);
  } else {
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-4 md:p-6 space-y-6"
  >
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white">
        Weather Dashboard
      </h1>
    </div>

    <div
      ref="dropdownWrapper"
      class="relative w-full md:w-1/2 flex items-center"
    >
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="พิมพ์ชื่อเมือง"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="showDropdown = true"
        class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-3 rounded flex-1 w-full focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
      />
      <Search
        class="h-5 w-5 absolute right-3 text-gray-400 dark:text-gray-300"
      />

      <ul
        v-if="showDropdown && filteredLocations.length"
        class="absolute z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded w-full shadow-lg max-h-48 overflow-auto top-full left-0 mt-1"
      >
        <li
          v-for="loc in filteredLocations"
          :key="loc.id"
          @click="fetchWeatherByCity(loc)"
          class="p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
          {{ loc.name }}
        </li>
      </ul>

      <p
        v-else-if="
          showDropdown && searchQuery.trim() && !filteredLocations.length
        "
        class="absolute z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded w-full shadow-lg max-h-48 p-3 top-full left-0 mt-1 text-gray-500 dark:text-gray-300 text-sm"
      >
        ไม่พบเมืองที่คุณค้นหา
      </p>
    </div>

    <div
      v-if="!loading && locations.length === 0"
      class="flex flex-col items-center justify-center p-16 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-lg border border-blue-300 dark:border-blue-700 h-96 text-blue-800 dark:text-blue-200"
    >
      <AlertTriangle class="h-10 w-10 text-blue-600 dark:text-blue-300" />
      <p class="mt-4 text-xl font-bold">ไม่พบเมืองที่ติดตาม</p>
      <p class="text-md mt-2 text-center">
        กรุณาไปที่หน้า Locations เพื่อเพิ่มเมืองที่ต้องการติดตาม
      </p>
    </div>

    <div
      v-else-if="loading && !weather"
      class="flex flex-col items-center justify-center p-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-gray-600 dark:text-gray-200 h-96"
    >
      <Loader class="h-10 w-10 text-blue-500 animate-spin" />
      <p class="mt-4 text-lg font-medium">กำลังโหลดข้อมูลสภาพอากาศ...</p>
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center p-16 bg-red-50 dark:bg-red-900 rounded-lg shadow-lg border border-red-300 dark:border-red-700 h-96 text-red-600 dark:text-red-400"
    >
      <AlertTriangle class="h-10 w-10" />
      <p class="mt-4 text-lg font-medium">{{ error }}</p>
    </div>

    <div v-else-if="weather" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <WeatherCard
          :city="weather.city"
          :temperature="weather.temperature"
          :humidity="weather.humidity"
          :windSpeed="weather.windspeed"
          :rain="weather.rain"
          :conditionCode="weather.conditionCode"
          :lastUpdated="
            new Date(weather.timestamp).toLocaleString('th-TH', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
              timeZone: weather.timezone || 'Asia/Bangkok',
            })
          "
        />
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg h-[400px] md:h-[450px]"
        >
          <HourlyChart
            :location-id="weather.location_id"
            :timezone="weather.timezone"
          />
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg h-[400px] md:h-[450px]"
        >
          <DailyChart
            :location-id="weather.location_id"
            :timezone="weather.timezone"
          />
        </div>
      </div>
    </div>
  </div>
</template>
