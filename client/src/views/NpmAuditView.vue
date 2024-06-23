<template>
  <q-page class="q-pa-md"
    ><q-card flat
      ><q-card-section class="text-h4">Npm audit</q-card-section>

      <q-separator />
      <q-card-section>
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh"
          @click="refreshAudit"
          :loading="servicesStore.loadingVulnerabilities"
        />
      </q-card-section>
      <q-card-section>
        <q-banner class="bg-grey-9 text-white">
          <div class="text-h6">Try to autofix</div>
          <div>How autofix works?</div>
          <li>Creates branch with name: "npm-audit-auto-fix-${new Date()}"</li>
          <li>Checkouts created branch</li>
          <li>Calls "npm audit fix"</li>
          <li>Creates commit</li>
          <li>Calls "git push"</li>
          <template v-slot:action>
            <q-btn
              icon="warning"
              color="red"
              label="Try auto fix"
              @click="tryAutoFix"
              :loading="servicesStore.fixingVulnerabilities"
            />
          </template>
        </q-banner>
      </q-card-section>
      <q-card-section>
        <div class="row text-h6">
          <div class="col-1">Service Name</div>
          <div class="col-2">Branch / Create MR</div>
          <div class="col justify-center flex">Info</div>
          <div class="col justify-center flex">Low</div>
          <div class="col justify-center flex">Moderate</div>
          <div class="col justify-center flex">High</div>
          <div class="col justify-center flex">Critical</div>
        </div>
        <q-separator class="q-ma-sm" />
        <div
          class="row"
          v-for="service of servicesStore.services"
          v-bind:key="service.name"
        >
          <div class="col-1 items-center flex">
            {{ service.name }}
          </div>
          <div class="col-2 row items-center">
            <branch-chip
              :status="
                servicesStore.servicesStatus.find(
                  (s) => s.name === service.name
                )
              "
            />
            <q-btn
              size="xs"
              class="q-pa-sm q-ma-xs"
              color="primary"
              icon="merge"
              @click="createMergeRequest(service)"
            />
          </div>
          <div class="col justify-center items-center flex">
            <npm-audit-chip
              severity="info"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.info"
            />
          </div>
          <div class="col justify-center items-center flex">
            <npm-audit-chip
              severity="low"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.low"
            />
          </div>
          <div class="col justify-center items-center flex">
            <npm-audit-chip
              severity="moderate"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.moderate"
            />
          </div>
          <div class="col justify-center items-center flex">
            <npm-audit-chip
              severity="high"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.high"
            />
          </div>
          <div class="col justify-center items-center flex">
            <npm-audit-chip
              severity="critical"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.critical"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { type Service, useServicesStore } from "@/stores/services";
import ServiceRunStatus from "@/components/ServiceRunStatus.vue";
import NpmAuditChip from "@/components/NpmAuditChip.vue";
import BranchChip from "@/components/BranchChip.vue";

const servicesStore = useServicesStore();

const refreshAudit = () => {
  servicesStore.getNpmAuditForAllServices();
};

const tryAutoFix = async () => {
  await servicesStore.tryAutoFixAllServices();
};

const createMergeRequest = (service: Service) => {
  window.open(
    `https://${
      service.gitUrl
    }/-/merge_requests/new?merge_request[source_branch]=${
      servicesStore.getServiceStatus(service.name)?.currentGitBranch
    }`,
    "_blank"
  );
};
</script>
