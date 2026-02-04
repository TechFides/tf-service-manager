<template>
  <q-page class="q-pa-md">
    <div v-if="serviceStatus">
      <q-card flat class="col-12">
        <q-card-section class="row">
          <div class="text-h5">Service tasks</div>
          <branch-chip class="q-ml-md" :status="serviceStatus" />
          <q-space />
          <a
            :href="servicesStore.getServiceAppUrl(serviceName)"
            target="_blank"
            class="service-link text-blue-5 q-mt-sm"
          >
            <q-icon name="launch" size="20px" class="q-mr-sm" />{{
              servicesStore.getServiceAppUrl(serviceName)
            }}</a
          >
        </q-card-section>
        <q-separator />
        <q-card-section class="row">
          <q-btn-dropdown
            size="sm"
            color="primary"
            label="npm scripts"
            :menu-offset="[40, 3]"
            :disable="serviceStatus.runningScript !== ''"
            unelevated
          >
            <q-list>
              <q-item
                v-for="pckgScript of servicesStore.getServiceByName(serviceName)
                  ?.pckgScripts || []"
                v-bind:key="pckgScript"
                clickable
                v-close-popup
                dense
                @click="runPckgScript(pckgScript, serviceName)"
              >
                <q-item-section>
                  <q-item-label>{{ pckgScript }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-chip
            color="grey-8"
            square
            v-if="serviceStatus.runningScript !== ''"
          >
            <q-spinner-hourglass
              color="white"
              size="17px"
              class="q-mr-md"
            />Running script:
            {{ serviceStatus.runningScript }}
          </q-chip>
          <q-space />
          <q-btn
            v-for="task of tasksStore.tasks"
            v-bind:key="task.name"
            :color="task.color"
            :label="task.name"
            class="q-ma-xs"
            size="sm"
            :icon="task.icon"
            :disable="!tasksStore.runnableStatus[task.name]?.[serviceName]"
            @click="runTask(task.name, serviceName)"
          />
          <custom-action-button
            :disable-button-function="disableOnEmptySelection"
            :disable-task-function="disableTaskBasedOnRunState"
            btn-label="Custom action"
            btn-class="q-ma-xs"
            :run-task-function="runTask"
            :service-name="serviceName"
            :tasks="servicesStore.getServiceByName(serviceName)?.tasks || []"
          />
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="q-pa-md text-center">
      <q-spinner size="30px" color="primary" />
      <div class="text-grey q-mt-sm">Loading service...</div>
    </div>

    <div class="q-pt-md">
      <q-card flat class="col-12">
        <q-card-section>
          <logs-explorer
            :logs="logsStore.logsForService(serviceName)"
            :height="logsExplorerHeight"
            :clear-logs-callback="clearLogs"
            :show-service-name="false"
            ref="logsExplorer"
          />
        </q-card-section>
      </q-card>
    </div>
    <ConfirmDialog ref="refConfirmDialog" />
  </q-page>
</template>

<script setup lang="ts">
import { useLogsStore } from "@/stores/logs";
import { useTasksStore } from "@/stores/tasks";
import { useRoute } from "vue-router";
import LogsExplorer from "@/components/LogsExplorer.vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useServicesStore } from "@/stores/services";
import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog.vue";
import BranchChip from "@/components/chips/BranchChip.vue";
import CustomActionButton from "@/components/CustomActionButton.vue";
import type { Task } from "@/stores/tasks";

// Use 'any' for the template ref to avoid strict type issues with Quasar components
const refConfirmDialog = ref<any>(null);
const logsStore = useLogsStore();
const tasksStore = useTasksStore();
const servicesStore = useServicesStore();
const route = useRoute();

const serviceName = computed(() => (route.params.name as string) || "");

const serviceStatus = computed(() =>
  servicesStore.servicesStatus.find((s) => s.name === serviceName.value),
);

const runTask = (task: string, service: string) => {
  tasksStore.runTask(task, service);
};

const runPckgScript = (scriptName: string, service: string) => {
  console.log(`running ${scriptName} on ${service}`);
  tasksStore.runPckgScript(service, scriptName);
};

const clearLogs = () => {
  console.log(`Clearing logs for service: ${serviceName.value}`);
  logsStore.clearLogs(serviceName.value);
};

const disableOnEmptySelection = (tasks: Task[]): boolean => {
  return tasks.length === 0;
};
const disableTaskBasedOnRunState = (task: Task, service: string): boolean => {
  return !tasksStore.runnableStatus[task.name]?.[service];
};

/**
 * Logs explorer resize
 */
const logsExplorerHeight = ref<number>(0);
const resizeObserver = () => {
  logsExplorerHeight.value = window.innerHeight - 310;
};
onMounted(() => {
  window.addEventListener("resize", resizeObserver);
  resizeObserver();
});
onUnmounted(() => {
  window.removeEventListener("resize", resizeObserver);
});
</script>

<style scoped lang="scss"></style>
