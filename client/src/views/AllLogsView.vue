<template>
  <q-page class="q-pa-md">
    <div class="row full-height">
      <q-card flat class="col-12 q-pa-sm">
        <q-card-section class="">
          <logs-explorer
            :logs="logsStore.allLogs"
            :height="logsExplorerHeight"
            :clear-logs-callback="clearLogs"
          />
        </q-card-section>
      </q-card>
    </div>
    <q-page-scroller
      reverse
      position="bottom-right"
      :scroll-offset="20"
      :offset="[20, 20]"
    >
      <q-btn fab icon="keyboard_arrow_down" color="primary" />
    </q-page-scroller>
  </q-page>
</template>

<script setup lang="ts">
import LogsExplorer from "@/components/LogsExplorer.vue";
import { useLogsStore } from "@/stores/logs";
import { onMounted, onUnmounted, ref } from "vue";

const logsStore = useLogsStore();
const clearLogs = () => {
  console.log(`Clearing logs for all services`);
  logsStore.clearLogs();
};

/**
 * Logs explorer resize
 */
const logsExplorerHeight = ref<number>(0);
const resizeObserver = () => {
  logsExplorerHeight.value = window.innerHeight - 165;
};
onMounted(() => {
  window.addEventListener("resize", resizeObserver);
  resizeObserver();
});
onUnmounted(() => {
  window.removeEventListener("resize", resizeObserver);
});
</script>

<style scoped lang="scss">
.logs-container {
  font-family: monospace;
  height: 100%;
  max-height: 100%;
  p {
    padding: 0;
    margin: 0;
  }
}
</style>
