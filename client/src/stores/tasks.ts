import { defineStore } from "pinia";
import axios from "axios";
import { SM_BACKEND_URL } from "@/config";
import { useServicesStore, type ServiceStatus } from "@/stores/services";
import { useSettingsStore } from "@/stores/settings";

export interface Task {
  name: string;
  color: string;
  icon: string;
  runIfNotCloned: boolean;
  runIfRunStatusIs: string[];
}

export interface BranchTask {
  name: string;
  confirmText?: string;
  color: string;
  icon: string;
}

interface TaskState {
  tasks: Task[];
  branchTasks: BranchTask[];
}

const isTaskRunnable = function (
  serviceStatus: ServiceStatus,
  task: Task,
): boolean {
  if (task.runIfNotCloned) {
    return !serviceStatus.cloned;
  } else {
    return (
      task.runIfRunStatusIs.includes(serviceStatus.runStatus) &&
      serviceStatus.cloned
    );
  }
};

export const useTasksStore = defineStore({
  id: "tf-sm-tasks",
  state: () =>
    ({
      tasks: [],
      branchTasks: [],
    }) as TaskState,

  getters: {
    runnableStatus: (state): { [key: string]: { [key: string]: boolean } } => {
      const result: { [key: string]: { [key: string]: boolean } } = {};

      const servicesStore = useServicesStore();
      for (const task of state.tasks) {
        result[task.name] = {};
        for (const serviceStatus of servicesStore.servicesStatus) {
          result[task.name][serviceStatus.name] = isTaskRunnable(
            serviceStatus,
            task,
          );
        }
      }
      for (const service of servicesStore.services) {
        for (const task of service.tasks) {
          if (!Object.prototype.hasOwnProperty.call(result, task.name)) {
            result[task.name] = {};
          }
          for (const serviceStatus of servicesStore.servicesStatus) {
            result[task.name][serviceStatus.name] = isTaskRunnable(
              serviceStatus,
              task,
            );
          }
        }
      }
      return result;
    },
  },
  actions: {
    async getAllTasks() {
      const response = await axios.get(SM_BACKEND_URL + "/tasks");
      this.tasks = response.data;
    },
    async getAllBranchTasks() {
      const response = await axios.get(SM_BACKEND_URL + "/branch-tasks");
      this.branchTasks = response.data.branchTasks;
    },
    async runTask(task: string, service: string) {
      const settingsStore = useSettingsStore();
      const attributes: { [key: string]: string } = {};
      if (task === "GIT_CLONE") {
        attributes.gitCheckoutType = settingsStore.gitCheckoutType;
      }
      await axios.post(SM_BACKEND_URL + "/run/task", {
        task,
        service,
        attributes,
      });
    },
    async runNpmScript(service: string, npmScript: string) {
      await axios.post(SM_BACKEND_URL + "/run/npm-script", {
        service,
        npmScript,
      });
    },
  },
});
