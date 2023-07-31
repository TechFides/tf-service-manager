import { defineStore } from "pinia";
import axios from "axios";
import { SM_BACKEND_URL } from "@/config";
import type { Task } from "./tasks";

export const MAX_MONITOR_HISTORY = 60;

export interface Service {
  name: string;
  appUrl: string;
  color: string;
  coverageBadge: string;
  pipelineBadge: string;
  tasks: Task[];
}
export interface ServiceStatus {
  name: string;
  cloned: boolean;
  runStatus: string;
  runningNpmScript: string;
  currentGitBranch: string;
  currentGitBranchHasChanges: boolean;
  currentGitBranchAhead: number;
  currentGitBranchBehind: number;
}

export interface ServiceMonitor {
  name: string;
  cpuPercent: number[];
  memoryMegaBytes: number[];
}

interface ServiceState {
  services: Service[];
  servicesStatus: ServiceStatus[];
  servicesMonitors: ServiceMonitor[];
}

export const useServicesStore = defineStore({
  id: "tf-sm-services",
  state: () =>
    ({
      services: [],
      servicesStatus: [],
      servicesMonitors: [],
    } as ServiceState),

  getters: {
    getServiceStatus: (state) => {
      return (service: string) => {
        return state.servicesStatus.find((s) => s.name === service);
      };
    },
    getServiceByName: (state) => {
      return (service: string) => {
        return state.services.find((s) => s.name === service);
      };
    },
    getServiceAppUrl: (state) => {
      return (service: string) => {
        return state.services.find((s) => s.name === service)?.appUrl;
      };
    },
  },
  actions: {
    async getAllServices() {
      const response = await axios.get(SM_BACKEND_URL + "/services");
      const services = response.data.services as Service[];
      this.services = services.map((service) => {
        return {
          ...service,
          npmScripts: service.npmScripts ? service.npmScripts.sort() : [],
        };
      });
      this.servicesMonitors = services.map((service) => {
        return {
          name: service.name,
          cpuPercent: Array(MAX_MONITOR_HISTORY).fill(0),
          memoryMegaBytes: Array(MAX_MONITOR_HISTORY).fill(0),
        };
      });
    },
    async getAllServicesStatus() {
      const response = await axios.get(SM_BACKEND_URL + "/services-status");
      this.servicesStatus = response.data.services;
    },

    addServiceMonitorData(
      service: string,
      cpuPercent: number,
      memoryMegaBytes: number
    ) {
      const serviceMonitor = this.servicesMonitors.find(
        (s) => s.name === service
      );

      if (serviceMonitor) {
        serviceMonitor.cpuPercent.push(cpuPercent);
        serviceMonitor.cpuPercent = serviceMonitor.cpuPercent.slice(
          -MAX_MONITOR_HISTORY
        );
        serviceMonitor.memoryMegaBytes.push(memoryMegaBytes);
        serviceMonitor.memoryMegaBytes = serviceMonitor.memoryMegaBytes.slice(
          -MAX_MONITOR_HISTORY
        );
      }
    },
  },
});
