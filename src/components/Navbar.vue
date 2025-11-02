<script setup>
import { ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { Cloud, Moon, Sun } from "lucide-vue-next";

const route = useRoute();

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/locations", label: "Locations" },
  { to: "/compare", label: "Compare" },
  { to: "/login", label: "Login" },
];

const isActive = (path) => route.path === path;

const isDarkMode = ref(document.documentElement.classList.contains("dark"));

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;

  document.documentElement.classList.toggle("dark", isDarkMode.value);
};
</script>

<template>
  <nav
    class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md"
  >
    <div class="container mx-auto px-4 md:px-6">
      <div class="flex h-16 items-center justify-center sm:justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-2 font-extrabold text-xl transition-colors text-gray-900 dark:text-white"
        >
          <Cloud class="hidden sm:inline h-6 w-6 text-blue-500" />
          <span class="hidden sm:inline">WeatherHub</span>
        </RouterLink>

        <div class="flex items-center space-x-4">
          <div class="flex space-x-1 sm:space-x-2">
            <RouterLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              class="px-2 py-2 sm:px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              :class="{
                'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100':
                  isActive(link.to),
                'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800':
                  !isActive(link.to),
              }"
            >
              {{ link.label }}
            </RouterLink>
          </div>

          <button
            @click="toggleDarkMode"
            :aria-label="isDarkMode ? 'สลับไป Light Mode' : 'สลับไป Dark Mode'"
            class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Sun v-if="!isDarkMode" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
