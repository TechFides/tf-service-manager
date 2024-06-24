<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-6"><cpu-usage-chart /></div>
      <div class="col-6"><memory-usage-chart /></div>
      <div class="col-12">
        <q-card flat>
          <q-card-section>
            <div class="text-h6">Services Status</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-table
              hide-pagination
              :rows="servicesStore.servicesStatus"
              :columns="serviceStatusColumns"
              :rows-per-page-options="[0]"
              row-key="name"
              flat
            >
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="name" :props="props">
                    <q-toggle
                      v-model="settingStore.selectedServices"
                      :val="props.row.name"
                      class="q-pr-sm"
                      size="sm"
                      @update:model-value="
                        (value, _) => updateCustomTasksForSelected(value)
                      "
                    />
                    <a
                      :href="servicesStore.getServiceAppUrl(props.row.name)"
                      target="_blank"
                      class="service-link text-blue-5"
                    >
                      <q-icon name="launch" size="20px" class="q-mr-sm" />{{
                        props.row.name
                      }}</a
                    >
                  </q-td>

                  <q-td key="branch" :props="props" class="text-left">
                    <q-spinner-hourglass
                      v-if="
                        gitTasks.includes(
                          servicesStore.servicesStatus.filter(
                            (svc) => svc.name === props.row.name
                          )[0].runningTask
                        )
                      "
                      color="white"
                      size="sm"
                    />
                    <branch-chip v-else :status="props.row" />
                  </q-td>

                  <q-td key="cloned" :props="props">
                    <q-icon
                      v-if="props.row.cloned"
                      size="sm"
                      color="green"
                      name="check_circle_outline"
                    />
                    <q-icon v-else size="sm" color="red" name="highlight_off" />
                  </q-td>

                  <q-td key="runStatus" :props="props">
                    <service-run-status :run-status="props.row.runStatus" />
                  </q-td>

                  <q-td
                    v-bind:key="task.name"
                    v-for="task of tasksStore.tasks"
                    :props="props"
                  >
                    <q-spinner-hourglass
                      v-if="
                        servicesStore.servicesStatus.filter(
                          (svc) => svc.name === props.row.name
                        )[0].runningTask === task.name
                      "
                      color="white"
                      size="sm"
                    />
                    <q-btn
                      v-else
                      size="sm"
                      :color="task.color"
                      :icon="task.icon"
                      :disable="
                        !tasksStore.runnableStatus[task.name][props.row.name]
                      "
                      @click="runTask(task.name, props.row.name)"
                    />
                  </q-td>
                  <q-td key="custom" :props="props">
                    <q-spinner-hourglass
                      v-if="
                        servicesStore.getServiceByName(props.row.name)?.tasks!
                        .map((task) => task.name)
                        .includes(servicesStore.servicesStatus.filter(
                            (svc) => svc.name === props.row.name
                          )[0].runningTask)
                      "
                      color="white"
                      size="sm" />
                    <custom-action-button
                      v-else
                      :disable-button-function="disableOnEmptySelection"
                      :disable-task-function="disableTaskBasedOnRunState"
                      :run-task-function="runTask"
                      :service-name="props.row.name"
                      :tasks="servicesStore.getServiceByName(props.row.name)?.tasks!"
                  /></q-td>
                </q-tr>
              </template>
              <template v-slot:top-row="props">
                <q-tr :props="props">
                  <q-td>
                    <q-btn
                      size="sm"
                      icon="check_box"
                      color="primary"
                      class="q-mr-sm q-pa-sm"
                      @click="selectAllServices"
                    />
                    <q-btn
                      size="sm"
                      icon="check_box_outline_blank"
                      color="primary"
                      class="q-mr-sm q-pa-sm"
                      @click="deselectAllServices"
                    />
                    <span class="">Run for selected</span>
                  </q-td>
                  <q-td></q-td>
                  <q-td></q-td>
                  <q-td></q-td>
                  <q-td
                    class="text-center"
                    v-bind:key="task.name"
                    v-for="task of tasksStore.tasks"
                  >
                    <q-btn
                      size="sm"
                      :color="task.color"
                      :icon="task.icon"
                      :disable="settingStore.selectedServices.length === 0"
                      @click="runAllTaskForSelectedServices(task.name)"
                    />
                  </q-td>
                  <q-td key="custom" class="text-center">
                    <custom-action-button
                      :disable-button-function="disableOnEmptySelection"
                      :disable-task-function="alwaysEnableTask"
                      :run-task-function="runAllTaskForSelectedServices"
                      :tasks="runAllCustomTasks"
                      service-name="All"
                    />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6">
        <pipeline-status :services="servicesStore.services" />
      </div>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import type { QTableProps } from "quasar";
import { useServicesStore } from "@/stores/services";
import { useTasksStore } from "@/stores/tasks";
import { useSettingsStore } from "@/stores/settings";
import type { Task } from "@/stores/tasks";

import { computed, ref, type Ref } from "vue";
import ServiceRunStatus from "@/components/ServiceRunStatus.vue";
import PipelineStatus from "@/components/PipelineStatus.vue";
import CpuUsageChart from "@/components/charts/CpuUsageChart.vue";
import MemoryUsageChart from "@/components/charts/MemoryUsageChart.vue";
import BranchChip from "@/components/chips/BranchChip.vue";
import CustomActionButton from "@/components/CustomActionButton.vue";

const gitTasks = ["GIT_PULL", "GIT_RESET", "GIT_CHECKOUT"];

const servicesStore = useServicesStore();
const tasksStore = useTasksStore();
const settingStore = useSettingsStore();
const serviceStatusColumns = computed((): QTableProps["columns"] => {
  const columns: QTableProps["columns"] = [
    {
      name: "name",
      label: "Name",
      align: "left",
      field: (row) => row.name,
    },
    {
      name: "branch",
      label: "Git branch",
      align: "left",
      field: (row) => row.currentGitBranch,
    },
    {
      name: "cloned",
      label: "Cloned",
      align: "center",
      field: (row) => row.cloned,
    },
    {
      name: "runStatus",
      label: "Run status",
      align: "center",
      field: (row) => row.runStatus,
    },
  ];
  for (const task of tasksStore.tasks) {
    columns.push({
      name: task.name,
      label: task.name,
      align: "center",
      field: (row) => row.name,
    });
  }
  columns.push({
    name: "custom",
    label: "Custom action",
    align: "center",
    field: (row) => row.currentGitBranch,
  });
  return columns;
});

const selectAllServices = () => {
  settingStore.selectedServices = servicesStore.services.map((s) => s.name);
  updateCustomTasksForSelected(settingStore.selectedServices);
};

const deselectAllServices = () => {
  settingStore.selectedServices = [];
  updateCustomTasksForSelected(settingStore.selectedServices);
};

const runTask = (task: string, service: string) => {
  tasksStore.runTask(task, service);
};

const runAllTaskForSelectedServices = (task: string) => {
  for (const service of servicesStore.services) {
    if (settingStore.selectedServices.includes(service.name)) {
      tasksStore.runTask(task, service.name);
    }
  }
};
var runAllCustomTasks: Ref<Task[]> = ref([]);

const updateCustomTasksForSelected = (enabled_services: string[]): void => {
  var taskIntersection: Task[] = [];
  var started: boolean = false;
  for (const service of servicesStore.services) {
    if (enabled_services.includes(service.name)) {
      if (!started) {
        // set initial value for task intersection
        taskIntersection = service.tasks;
        started = true;
      } else {
        taskIntersection = taskIntersection.filter((intersectTask) =>
          service.tasks.some((task) => task.name == intersectTask.name)
        );
      }
    }
  }
  runAllCustomTasks.value = taskIntersection;
};

const disableOnEmptySelection = (tasks: Task[]): boolean => {
  return tasks.length === 0;
};
const disableTaskBasedOnRunState = (task: Task, service: string): boolean => {
  return !tasksStore.runnableStatus[task.name][service];
};
const alwaysEnableTask = (): boolean => {
  return false; // used in `disable` so to enable, we must return false
};

defineExpose({
  updateCustomTasksForSelected,
});
</script>
<style lang="scss">
.run-for-all-services {
  width: 200px;
}
</style>
