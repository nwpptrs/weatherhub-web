<script>
import api from "../../services/api";

const weatherApi = {
  // ดึงข้อมูลสภาพอากาศล่าสุด
  async getLatest(locationId) {
    return api.get(`/api/weather/latest`, {
      params: { location_id: locationId },
      cache: { ttl: 0 },
    });
  },

  // ดึงข้อมูลรายชั่วโมง
  async getHourly(locationId) {
    return api.get(`/api/weather/hourly`, {
      params: { location_id: locationId },
    });
  },

  // ดึงข้อมูลรายวัน
  async getDaily(locationId) {
    return api.get(`/api/weather/daily`, {
      params: { location_id: locationId },
    });
  },

  // ดึงข้อมูลย้อนหลัง
  async backfill(locationId, days = 3) {
    const response = await api.post(
      `/api/weather/backfill?location_id=${locationId}&days=${days}`
    );

    if (response.status === 200) {
      await this.getLatest(locationId);
    }

    return response;
  },
};

export default weatherApi;
</script>
