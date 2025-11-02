<script>
import api from "../../services/api";

const locationApi = {
  // ดึงรายการเมืองทั้งหมด
  async getAll() {
    return api.get("/api/locations", {
      cache: { ttl: 0 },
    });
  },

  // เพิ่มเมืองใหม่
  async add(locationData) {
    return api.post("/api/location", locationData);
  },

  // ลบเมือง
  async remove(locationId) {
    return api.delete(`/api/location/${locationId}`);
  },
};

export default locationApi;
</script>
