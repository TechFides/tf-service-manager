import { defineStore } from "pinia";
import axios from "axios";
import { SM_BACKEND_URL } from "@/config";
import type { Task } from "./tasks";
import type {
  NpmAuditOutput,
  VulnerabilityCount,
} from "@/stores/npm-audit-result";

export const MAX_MONITOR_HISTORY = 60;

export interface Service {
  name: string;
  appUrl: string;
  color: string;
  coverageBadge: string;
  pipelineBadge: string;
  tasks: Task[];
  vulnerabilities?: VulnerabilityCount;
  npmScripts?: string[];
  gitUrl: string;
  packageManager?: string;
}
export interface ServiceStatus {
  name: string;
  cloned: boolean;
  runStatus: string;
  runningScript: string;
  runningTask: string;
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
  loadingVulnerabilities: boolean;
  fixingVulnerabilities: boolean;
}

export const useServicesStore = defineStore({
  id: "tf-sm-services",
  state: () =>
    ({
      services: [],
      servicesStatus: [],
      servicesMonitors: [],
      loadingVulnerabilities: false,
      fixingVulnerabilities: false,
    }) as ServiceState,

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
    /**
     * Fetches all services from the backend and stores them in memory.
     *
     * @returns {Promise<void>} A Promise that resolves once the services are fetched and stored.
     */
    async getAllServices(): Promise<void> {
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

    /**
     * Gets the status of all services.
     *
     * @returns {Promise<void>} A Promise that resolves when the status of all services is retrieved.
     */
    async getAllServicesStatus(): Promise<void> {
      const response = await axios.get(SM_BACKEND_URL + "/services-status");
      this.servicesStatus = response.data.services;
    },

    /**
     * Get Npm audit for all services.
     *
     * @returns {Promise<void>} - A Promise that resolves when the Npm audit for all services is complete.
     */
    async getNpmAuditForAllServices(): Promise<void> {
      this.loadingVulnerabilities = true;
      for (const service of this.services) {
        delete service.vulnerabilities;
      }
      for (const service of this.services) {
        await this.getNpmAuditForService(service.name);
      }

      this.loadingVulnerabilities = false;
    },

    /**
     * Tries to automatically fix the npm audit issues for a given service.
     *
     * @param {string} serviceName - The name of the service.
     * @param {object} params - The parameters for fixing the npm audit issues.
     * @param {string} params.branch - The branch to use for fixing the issues.
     * @param {boolean} params.useForce - Whether to force the fixes, even if it may cause breaking changes.
     * @param {boolean} params.pushToOrgin - Whether to push the fixed changes to the origin repository.
     * @return {Promise<void>} - A promise that resolves once the fix request has been made.
     */
    async tryAutoFixService(
      serviceName: string,
      params: {
        branch: string;
        useForce: boolean;
        pushToOrigin: boolean;
      },
    ): Promise<void> {
      const service = this.services.find((s) => s.name === serviceName);
      if (service) {
        delete service.vulnerabilities;
        await axios.post(
          SM_BACKEND_URL + `/services/${serviceName}/npm-audit-auto-fix`,
          params,
        );
      }
    },

    /**
     * Retrieves the npm audit information for a given service.
     * @param {string} serviceName - The name of the service.
     * @return {Promise<void>} - A promise that resolves when the npm audit information has been retrieved.
     */
    async getNpmAuditForService(serviceName: string): Promise<void> {
      const service = this.services.find((s) => s.name === serviceName);
      const serviceStatus = this.servicesStatus.find(
        (s) => s.name === serviceName,
      );
      if (service && serviceStatus?.cloned) {
        delete service.vulnerabilities;
        const response = await axios.get(
          SM_BACKEND_URL + `/services/${serviceName}/npm-audit`,
        );
        const data = response.data as NpmAuditOutput;
        service.vulnerabilities = data.metadata.vulnerabilities;
      }
    },

    addServiceMonitorData(
      service: string,
      cpuPercent: number,
      memoryMegaBytes: number,
    ) {
      const serviceMonitor = this.servicesMonitors.find(
        (s) => s.name === service,
      );

      if (serviceMonitor) {
        serviceMonitor.cpuPercent.push(cpuPercent);
        serviceMonitor.cpuPercent =
          serviceMonitor.cpuPercent.slice(-MAX_MONITOR_HISTORY);
        serviceMonitor.memoryMegaBytes.push(memoryMegaBytes);
        serviceMonitor.memoryMegaBytes =
          serviceMonitor.memoryMegaBytes.slice(-MAX_MONITOR_HISTORY);
      }
    },
  },
});
