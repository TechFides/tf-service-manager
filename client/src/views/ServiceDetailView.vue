<template>
  <q-page class="q-pa-md">
    <div>
      <q-card flat class="col-12">
        <q-card-section class="row">
          <div class="text-h5">Service tasks</div>
          <branch-chip class="q-ml-md" :status="serviceStatus" />
          <q-space />
          <a
            :href="servicesStore.getServiceAppUrl(route.params.name)"
            target="_blank"
            class="service-link text-blue-5 q-mt-sm"
          >
            <q-icon name="launch" size="20px" class="q-mr-sm" />{{
              servicesStore.getServiceAppUrl(route.params.name)
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
                v-for="npmScript of servicesStore.getServiceByName(
                  route.params.name,
                ).npmScripts"
                v-bind:key="npmScript"
                clickable
                v-close-popup
                dense
                @click="runPckgScript(npmScript, route.params.name)"
              >
                <q-item-section>
                  <q-item-label>{{ npmScript }}</q-item-label>
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
            :disable="!tasksStore.runnableStatus[task.name][route.params.name]"
            @click="runTask(task.name, route.params.name)"
          />
          <custom-action-button
            :disable-button-function="disableOnEmptySelection"
            :disable-task-function="disableTaskBasedOnRunState"
            btn-label="Custom action"
            btn-class="q-ma-xs"
            :run-task-function="runTask"
            :service-name="route.params.name as string"
            :tasks="
              servicesStore.getServiceByName(route.params.name as string)
                ?.tasks!
            "
          />
        </q-card-section>
      </q-card>
    </div>
    <div class="q-pt-md">
      <q-card flat class="col-12">
        <q-card-section>
          <logs-explorer
            :logs="logsStore.logsForService(route.params.name)"
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
import { useServicesStore, type ServiceStatus } from "@/stores/services";
import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog.vue";
import BranchChip from "@/components/chips/BranchChip.vue";
import CustomActionButton from "@/components/CustomActionButton.vue";
import type { Task } from "@/stores/tasks";

const refConfirmDialog = ref(ConfirmDialog);
const logsStore = useLogsStore();
const tasksStore = useTasksStore();
const servicesStore = useServicesStore();
const route = useRoute();

const serviceStatus = computed(
  () =>
    servicesStore.servicesStatus.find(
      (s) => s.name === route.params.name,
    ) as ServiceStatus,
);

const runTask = (task: string, service: string) => {
  tasksStore.runTask(task, service);
};

const runPckgScript = (scriptName: string, service: string) => {
  console.log(`running ${scriptName} on ${service}`);
  tasksStore.runPckgScript(service, scriptName);
};

const clearLogs = () => {
  const serviceName = route.params.name as string;
  console.log(`Clearing logs for service: ${serviceName}`);
  logsStore.clearLogs(serviceName);
};

const disableOnEmptySelection = (tasks: Task[]): boolean => {
  return tasks.length === 0;
};
const disableTaskBasedOnRunState = (task: Task, service: string): boolean => {
  return !tasksStore.runnableStatus[task.name][service];
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
