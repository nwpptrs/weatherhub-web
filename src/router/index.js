import { createRouter, createWebHistory } from "vue-router";
import Layout from "../Layouts/Layout.vue";
import Dashboard from "../pages/Dashboard.vue";
import Locations from "../pages/Locations.vue";
import Compare from "../pages/Compare.vue";
import Login from "../pages/Login.vue";

const routes = [
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        component: Dashboard,
      },
      {
        path: "/locations",
        component: Locations,
      },
      {
        path: "/compare",
        component: Compare,
      },
      {
        path: "/login",
        component: Login,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
