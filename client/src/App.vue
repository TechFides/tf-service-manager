<template>
  <q-layout view="hHh LpR fFf">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          TF Services Manager
          <q-chip square class="gray-4">{{ route.name }} </q-chip>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-list>
        <q-item
          clickable
          v-ripple
          active-class="bg-grey-9 text-white"
          :active="route.name === 'home'"
          @click="navigateTo('/')"
        >
          <q-item-section avatar>
            <q-icon color="blue-7" size="md" name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bolder text-capitalize"
              >Home</q-item-label
            >
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          active-class="bg-grey-9 text-white"
          :active="route.name === 'all-logs'"
          @click="navigateTo('/all-logs')"
        >
          <q-item-section avatar>
            <q-icon color="blue-7" size="md" name="format_list_bulleted" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bolder text-capitalize"
              >All logs</q-item-label
            >
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          active-class="bg-grey-9 text-white"
          :active="route.name === 'npm-audit'"
          @click="navigateTo('/npm-audit')"
        >
          <q-item-section avatar>
            <q-icon color="blue-7" size="md" name="lock" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bolder text-capitalize"
              >Package Audit</q-item-label
            >
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          active-class="bg-grey-9 text-white"
          :active="route.name === 'settings'"
          @click="navigateTo('/settings')"
        >
          <q-item-section avatar>
            <q-icon color="blue-7" size="md" name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bolder text-capitalize"
              >Settings</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item-label header>Services</q-item-label>
        <q-item
          clickable
          v-ripple
          @click="navigateTo(`/service-detail/${service.name}`)"
          active-class="bg-grey-9 text-white"
          :active="
            route.name === 'service-detail' &&
            route.params.name === service.name
          "
          v-for="service of servicesStore.services"
          v-bind:key="service.name"
        >
          <q-item-section>
            <q-item-label class="text-weight-bolder text-capitalize">{{
              service.name
            }}</q-item-label>
          </q-item-section>
          <q-item-section avatar>
            <service-run-status
              :run-status="
                servicesStore.getServiceStatus(service.name)?.runStatus
              "
            />
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item
          clickable
          v-ripple
          active-class="bg-grey-9 text-white"
          :active="route.name === 'about'"
          @click="navigateTo('/about')"
        >
          <q-item-section avatar>
            <q-icon color="blue-7" size="md" name="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bolder text-capitalize"
              >About</q-item-label
            >
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <component ref="homeView" :is="Component" />
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { io } from "socket.io-client";
import { useLogsStore } from "@/stores/logs";
import { useServicesStore } from "@/stores/services";
import { SM_BACKEND_URL } from "@/config";
import { useTasksStore } from "@/stores/tasks";
import ServiceRunStatus from "@/components/ServiceRunStatus.vue";
import { useSettingsStore } from "./stores/settings";
import { useResetStore } from "@/stores/resetToDefaultsStore";

const leftDrawerOpen = ref(false);
const homeView = ref();

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const quasar = useQuasar();
quasar.dark.set(true);

const tasksStore = useTasksStore();
tasksStore.getAllTasks();
tasksStore.getAllBranchTasks();

const logsStore = useLogsStore();
const servicesStore = useServicesStore();
const resetDefaultsStore = useResetStore();
servicesStore.getAllServices().then(() => {
  if (homeView.value.updateCustomTasksForSelected !== undefined) {
    const settingsStore = useSettingsStore();
    homeView.value.updateCustomTasksForSelected(settingsStore.selectedServices);
  }
});
servicesStore.getAllServicesStatus();

const socket = io(SM_BACKEND_URL);

socket.on("message", (msg) => {
  switch (msg.type) {
    case "log":
      logsStore.addLogs(msg.data);
      break;

    case "status-update":
      servicesStore.getAllServicesStatus();
      break;

    case "monitor-stats":
      for (const monitor of msg.data) {
        servicesStore.addServiceMonitorData(
          monitor.service,
          monitor.cpuPercent,
          monitor.memoryMegaBytes,
        );
      }
      break;

    case "reset-defaults-success":
      resetDefaultsStore.endReset();
      quasar.notify({
        type: "positive",
        message: "Reset to defaults was successful",
      });
      break;

    case "reset-defaults-error":
      resetDefaultsStore.endReset();
      quasar.notify({
        type: "negative",
        message: "Reset to defaults failed",
      });
      break;

    default:
      console.error("Unknown message type from WS");
      break;
  }
});

/**
 * navigate
 ****************************************************************/
const router = useRouter();
const navigateTo = (to: string) => {
  router.push(to);
};

const route = useRoute();
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
}
a {
  text-decoration: none;
  color: white;
}
</style>
