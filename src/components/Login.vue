<script setup>
import { ref, onMounted, computed } from "vue";
import { login } from "../api/login.vue";

const username = ref("");
const password = ref("");
const statusMessage = ref("");
const tokenRef = ref(localStorage.getItem("auth_token"));

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;

    const decodedPayload = JSON.parse(atob(payloadBase64));

    if (!decodedPayload.exp) return true;

    const expirationTime = decodedPayload.exp * 1000;

    return Date.now() >= expirationTime - 30000;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return true;
  }
};

const isTokenValid = computed(() => {
  return tokenRef.value && !isTokenExpired(tokenRef.value);
});

const tokenExpiryTime = computed(() => {
  if (!tokenRef.value) return null;
  try {
    const payloadBase64 = tokenRef.value.split(".")[1];
    if (!payloadBase64) return "Token ไม่ถูกต้อง";
    const decodedPayload = JSON.parse(atob(payloadBase64));
    if (!decodedPayload.exp) return "Token ไม่ถูกต้อง";

    const expirationTimeMs = decodedPayload.exp * 1000;
    const remainingMs = expirationTimeMs - Date.now();

    if (remainingMs <= 0) return "หมดอายุแล้ว";

    const seconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    let timeString = "เหลือ: ";
    if (hours > 0) timeString += `${hours} ชม. `;

    if (hours > 0 || remainingMinutes > 0)
      timeString += `${remainingMinutes} น. `;

    return timeString;
  } catch (e) {
    return "Token ไม่ถูกต้อง";
  }
});

const handleLogout = (silent = false) => {
  localStorage.removeItem("auth_token");
  tokenRef.value = null;
  if (!silent) {
    statusMessage.value = "🚪 Logged out. Token cleared.";
  }
};

onMounted(() => {
  if (tokenRef.value) {
    if (isTokenExpired(tokenRef.value)) {
      handleLogout(true);
      statusMessage.value = "⚠️ Token หมดอายุแล้ว! กรุณาเข้าสู่ระบบใหม่";
    } else {
      statusMessage.value = "สถานะ: มี Token สามารถใช้งานระบบได้";
    }
  } else {
    statusMessage.value = "สถานะ: ไม่พบ Token";
  }
});

const handleLogin = async () => {
  statusMessage.value = "กำลังพยายาม Login...";
  try {
    const response = await login({
      username: username.value,
      password: password.value,
    });

    const token = response.data.token;

    localStorage.setItem("auth_token", token);
    tokenRef.value = token;
    username.value = "";
    password.value = "";

    statusMessage.value = `✅ Login สำเร็จ! (${tokenExpiryTime.value})`;
  } catch (error) {
    password.value = "";
    const errorMessage = error.response?.data?.error || error.message;
    statusMessage.value = `❌ Login ล้มเหลว: ${errorMessage}`;
    console.error("Login Error:", error);
  }
};
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors"
  >
    <div
      class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-2xl transition-colors"
    >
      <h2
        class="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-6"
      >
        Login (Admin Mockup)
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-2">
          <label
            for="username"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
          >
            Username:
          </label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="ป้อนชื่อผู้ใช้งาน"
            required
            class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div class="space-y-2">
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
          >
            Password:
          </label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="ป้อนรหัสผ่าน (admin)"
            required
            class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="!username || !password || isTokenValid"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150"
        >
          Login
        </button>
      </form>

      <button
        @click="handleLogout()"
        :disabled="!tokenRef"
        class="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150"
      >
        Logout
      </button>

      <p
        :class="[
          'mt-6 p-3 rounded-md text-sm font-semibold text-center transition-colors',
          statusMessage.includes('สำเร็จ')
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
            : statusMessage.includes('ล้มเหลว')
            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
            : statusMessage.includes('หมดอายุ')
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
        ]"
      >
        {{ statusMessage }}
      </p>

      <div
        class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-left text-sm text-gray-500 dark:text-gray-400 transition-colors"
      >
        <h3 class="font-bold text-gray-700 dark:text-gray-200 mb-2">
          Token Status:
        </h3>

        <p v-if="isTokenValid">
          <span class="text-green-600 dark:text-green-400 font-medium"
            >✅ Token ใช้งานได้:
          </span>
          {{ tokenExpiryTime }}
        </p>

        <p
          v-else-if="tokenRef && tokenExpiryTime === 'หมดอายุแล้ว'"
          class="text-yellow-600 dark:text-yellow-400 font-medium"
        >
          ⚠️ Token หมดอายุแล้ว (โปรด Logout)
        </p>

        <p
          v-else-if="tokenRef && tokenExpiryTime === 'Token ไม่ถูกต้อง'"
          class="text-red-600 dark:text-red-400 font-medium"
        >
          ❌ Token ไม่ถูกต้อง (โปรด Logout)
        </p>

        <p v-else class="text-red-600 dark:text-red-400 font-medium">
          ❌ ไม่มี Token
        </p>
      </div>
    </div>
  </div>
</template>
