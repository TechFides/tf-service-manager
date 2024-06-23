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
            />
          </template>
        </q-banner>
      </q-card-section>
      <q-card-section>
        <div class="row text-h6">
          <div class="col">Service Name</div>
          <div class="col">Branch</div>
          <div class="col">Info</div>
          <div class="col">Low</div>
          <div class="col">Moderate</div>
          <div class="col">High</div>
          <div class="col">Critical</div>
        </div>
        <q-separator class="q-ma-sm" />
        <div
          class="row"
          v-for="service of servicesStore.services"
          v-bind:key="service.name"
        >
          <div class="col">
            {{ service.name }}
          </div>
          <div class="col">
            <branch-chip
              :status="
                servicesStore.servicesStatus.find(
                  (s) => s.name === service.name
                )
              "
            />
          </div>
          <div class="col">
            <npm-audit-chip
              severity="info"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.info"
            />
          </div>
          <div class="col">
            <npm-audit-chip
              severity="low"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.low"
            />
          </div>
          <div class="col">
            <npm-audit-chip
              severity="moderate"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.moderate"
            />
          </div>
          <div class="col">
            <npm-audit-chip
              severity="high"
              :loading="servicesStore.loadingVulnerabilities"
              :count="service.vulnerabilities?.high"
            />
          </div>
          <div class="col">
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
import { useServicesStore } from "@/stores/services";
import ServiceRunStatus from "@/components/ServiceRunStatus.vue";
import NpmAuditChip from "@/components/NpmAuditChip.vue";
import BranchChip from "@/components/BranchChip.vue";

const servicesStore = useServicesStore();

const refreshAudit = () => {
  servicesStore.getNpmAuditForAllServices();
};

const tryAutoFix = async () => {
  await servicesStore.tryAutoFix("TF_ADM");
  servicesStore.getNpmAuditForService("TF_ADM");
};
</script>
