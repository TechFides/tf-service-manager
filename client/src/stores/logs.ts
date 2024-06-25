import { defineStore } from "pinia";
import { shallowRef } from "vue";
import type { ShallowRef } from "vue";

const MAX_LOGS_IN_STORE = 4000;
const MAX_LOGS_DISPLAY_PER_SERVICE = 500;
const MAX_LOGS_DISPLAY_ALL_LOGS = 1000;

export interface Log {
  line: string;
  service: string;
  color: string;
  ts: string;
  uuid: string;
  info: boolean;
}

interface LogsState {
  logs: ShallowRef<Log[]>;
}

export const useLogsStore = defineStore({
  id: "tf-sm-logs",
  state: () =>
    ({
      logs: shallowRef<Log[]>([]),
    }) as LogsState,

  getters: {
    logsForService: (state) => {
      return (service: string) => {
        return state.logs
          .filter((l) => l.service === service)
          .slice(-MAX_LOGS_DISPLAY_PER_SERVICE);
      };
    },
    allLogs: (state) => {
      return state.logs.slice(-MAX_LOGS_DISPLAY_ALL_LOGS);
    },
  },
  actions: {
    addLogs(logs: Log[]) {
      this.logs = this.logs.concat(logs).splice(-MAX_LOGS_IN_STORE);
    },
    clearLogs(service?: string) {
      if (!service) {
        this.logs = [];
      } else {
        this.logs = this.logs.filter((l) => l.service !== service);
      }
    },
  },
});
