<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import locationApi from "../api/locations.vue";
import weatherApi from "../api/weather.vue";
import Swal from "sweetalert2";
import { PlusCircle, Trash2, Repeat2, MapPin, Loader2 } from "lucide-vue-next";

const locations = ref([]);
const map = ref(null);
const markers = ref([]);
const newCity = ref({ name: "", lat: "", lon: "", timezone: "Asia/Bangkok" });
const loading = ref(true);
const addingCity = ref(false);
const loadingError = ref(null);
const isDarkMode = ref(document.documentElement.classList.contains("dark"));
let tempMarker = null;

const handleThemeChange = () => {
  const newDarkMode = document.documentElement.classList.contains("dark");
  if (isDarkMode.value === newDarkMode) return;
  isDarkMode.value = newDarkMode;
};

const fetchLocations = async () => {
  loading.value = true;
  loadingError.value = null;
  try {
    const res = await locationApi.getAll();
    locations.value = res.data;

    markers.value.forEach((m) => map.value.removeLayer(m));
    markers.value = [];

    locations.value.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lon])
        .addTo(map.value)
        .bindPopup(`<b>${loc.name}</b><br>${loc.lat}, ${loc.lon}`);
      markers.value.push(marker);
    });
  } catch (err) {
    console.error("Error loading locations:", err);
    loadingError.value = "ไม่สามารถโหลดรายชื่อเมืองได้ โปรดตรวจสอบ Backend API";
  } finally {
    loading.value = false;
  }
};

const handleAddCity = async () => {
  if (!newCity.value.name || !newCity.value.lat || !newCity.value.lon) {
    Swal.fire(
      "ข้อผิดพลาด",
      "กรุณากรอกข้อมูล Latitude, Longitude และชื่อเมืองให้ครบ",
      "warning"
    );
    return;
  }

  addingCity.value = true;
  try {
    await locationApi.add(newCity.value);

    if (tempMarker) {
      map.value.removeLayer(tempMarker);
      tempMarker = null;
    }

    await fetchLocations();

    Swal.fire({
      title: "เพิ่มเมืองสำเร็จ!",
      text: `${newCity.value.name} ถูกบันทึกเรียบร้อย`,
      icon: "success",
      confirmButtonColor: "#3085d6",
    });

    newCity.value = { name: "", lat: "", lon: "", timezone: "Asia/Bangkok" };
  } catch (err) {
    console.error("Error adding city:", err);
    Swal.fire(
      "เกิดข้อผิดพลาด",
      "ไม่สามารถเพิ่มเมืองได้ หรือ ไม่มีสิทธิ์",
      "error"
    );
  } finally {
    addingCity.value = false;
  }
};

const handleDeleteCity = async (id, name) => {
  const result = await Swal.fire({
    title: `ลบ ${name}?`,
    text: "ข้อมูล hourly/daily ของเมืองนี้จะถูกลบทั้งหมด!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "ใช่, ลบเลย!",
  });

  if (result.isConfirmed) {
    try {
      await locationApi.remove(id);
      await fetchLocations();
      Swal.fire("ลบสำเร็จ!", `${name} ถูกลบเรียบร้อย`, "success");
    } catch (err) {
      console.error(err);
      Swal.fire(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถลบเมืองได้ หรือ ไม่มีสิทธิ์",
        "error"
      );
    }
  }
};

const handleBackfill = async (id, name) => {
  const result = await Swal.fire({
    title: `Backfill ข้อมูล ${name}?`,
    text: "ระบบจะดึงข้อมูลย้อนหลัง 3 วันมาเติมในฐานข้อมูล",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#aaa",
    confirmButtonText: "ยืนยันการ Backfill",
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      try {
        await weatherApi.backfill(id, 3);
        return true;
      } catch (err) {
        const message =
          err.response?.data?.error || err.message || "Unknown error";
        Swal.showValidationMessage(`Backfill ล้มเหลว: ${message}`);
        return false;
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });

  if (result.isConfirmed) {
    Swal.fire(
      "Backfill สำเร็จ!",
      `ข้อมูลของ ${name} ถูกอัปเดตย้อนหลัง 3 วันแล้ว (กราฟจะอัปเดต)`,
      "success"
    );
  }
};

onMounted(async () => {
  map.value = L.map("map").setView([13.7563, 100.5018], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map.value);

  await fetchLocations();

  map.value.on("click", (e) => {
    newCity.value.lat = e.latlng.lat.toFixed(4);
    newCity.value.lon = e.latlng.lng.toFixed(4);

    if (tempMarker) {
      map.value.removeLayer(tempMarker);
    }

    tempMarker = L.marker([e.latlng.lat, e.latlng.lng])
      .addTo(map.value)
      .bindPopup("ตำแหน่งที่เลือก")
      .openPopup();
  });
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<template>
  <div
    class="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors"
  >
    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-6">
      Locations Manager
    </h1>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2
          class="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2"
        >
          <MapPin class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          รายการเมืองที่ติดตาม
        </h2>

        <div
          v-if="loadingError"
          class="p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300"
        >
          เกิดข้อผิดพลาดในการโหลดเมือง: {{ loadingError }}
        </div>
        <div
          v-else-if="loading"
          class="p-12 text-center text-gray-500 dark:text-gray-400"
        >
          กำลังโหลดรายชื่อเมือง...
        </div>

        <div
          v-else
          class="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <table class="w-full text-sm text-gray-700 dark:text-gray-300">
            <thead class="text-lg text-left bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="p-3">ชื่อเมือง</th>
                <th class="p-3">Lat</th>
                <th class="p-3">Lon</th>
                <th class="p-3 hidden sm:table-cell">Timezone</th>
                <th class="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="city in locations"
                :key="city.id"
                class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition"
              >
                <td class="p-3 font-medium">{{ city.name }}</td>
                <td class="p-3 text-xs">{{ city.lat }}</td>
                <td class="p-3 text-xs">{{ city.lon }}</td>
                <td
                  class="p-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell"
                >
                  {{ city.timezone }}
                </td>
                <td class="p-3 text-center">
                  <div
                    class="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 justify-center"
                  >
                    <button
                      @click="handleBackfill(city.id, city.name)"
                      class="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition text-xs flex items-center justify-center gap-1"
                      title="ดึงข้อมูลย้อนหลัง 3 วัน"
                    >
                      <Repeat2 class="h-3 w-3" /> Backfill
                    </button>
                    <button
                      @click="handleDeleteCity(city.id, city.name)"
                      class="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition text-xs flex items-center justify-center gap-1"
                      title="ลบเมืองและข้อมูลทั้งหมด"
                    >
                      <Trash2 class="h-3 w-3" /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="locations.length === 0 && !loading">
                <td
                  colspan="5"
                  class="p-4 text-center text-gray-400 dark:text-gray-500 italic"
                >
                  ยังไม่มีเมืองที่ติดตาม กรุณาเพิ่มเมืองใหม่
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="bg-white dark:bg-gray-800 mt-8 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <h3
            class="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2"
          >
            <PlusCircle class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            เพิ่มเมืองใหม่
          </h3>

          <div class="flex flex-col gap-3">
            <input
              v-model="newCity.name"
              type="text"
              placeholder="ชื่อเมือง (เช่น Chiang Mai)"
              class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
            <div class="grid grid-cols-2 gap-3">
              <input
                v-model="newCity.lat"
                type="text"
                placeholder="Latitude (คลิกบนแผนที่ได้)"
                class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                readonly
              />
              <input
                v-model="newCity.lon"
                type="text"
                placeholder="Longitude (คลิกบนแผนที่ได้)"
                class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                readonly
              />
            </div>
            <input
              v-model="newCity.timezone"
              disabled
              type="text"
              class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
            />
            <button
              @click="handleAddCity"
              :disabled="addingCity"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="addingCity" class="h-5 w-5 animate-spin" />
              <span v-else>เพิ่มเมือง</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2
          class="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2"
        >
          แผนที่เลือกตำแหน่ง
        </h2>
        <div
          id="map"
          class="w-full h-[500px] rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        ></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
          คลิกบนแผนที่เพื่อกำหนดค่า Latitude/Longitude
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "leaflet/dist/leaflet.css";

#map {
  height: 500px;
  width: 100%;
  z-index: 10;
}
</style>
