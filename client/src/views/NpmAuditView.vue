<template>
  <q-page class="q-pa-md"
    ><q-card flat
      ><q-card-section class="text-h4">Npm audit</q-card-section>

      <q-separator />
      <q-card-section class="flex justify-end">
        <q-btn
          color="primary"
          icon="refresh"
          label="Scan all services"
          @click="refreshAudit"
          :loading="servicesStore.loadingVulnerabilities"
        />
      </q-card-section>
      <q-card-section>
        <q-banner class="bg-grey-9 text-white">
          <div class="text-h6">Try to autofix</div>
          <div>How autofix works?</div>
          <li>Creates new branch</li>
          <li>Checkouts created branch</li>
          <li>Calls "npm audit fix"</li>
          <li>Creates commit</li>
          <li>Calls "git push"</li>
          <template v-slot:action>
            <q-btn
              icon="warning"
              color="red"
              label="Try auto fix"
              @click="tryAutoFixButtonClick"
              :loading="
                servicesStore.fixingVulnerabilities ||
                servicesStore.loadingVulnerabilities
              "
            />
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <q-table
          hide-pagination
          :rows="servicesStore.services"
          :columns="columns"
          :rows-per-page-options="[0]"
          row-key="name"
          flat
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="name" :props="props">
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

              <q-td key="branch" :props="props" class="">
                <branch-chip
                  :status="
                    servicesStore.servicesStatus.find(
                      (s) => s.name === props.row.name,
                    )
                  "
                />
              </q-td>
              <q-td>
                <q-btn
                  size="xs"
                  class="q-pa-sm q-ma-xs"
                  color="primary"
                  icon="merge"
                  @click="createMergeRequest(props.row)"
                />
              </q-td>
              <q-td class="text-center">
                <npm-audit-chip
                  severity="info"
                  :loading="servicesStore.loadingVulnerabilities"
                  :count="props.row.vulnerabilities?.info"
              /></q-td>
              <q-td class="text-center">
                <npm-audit-chip
                  severity="low"
                  :loading="servicesStore.loadingVulnerabilities"
                  :count="props.row.vulnerabilities?.low"
              /></q-td>
              <q-td class="text-center">
                <npm-audit-chip
                  severity="moderate"
                  :loading="servicesStore.loadingVulnerabilities"
                  :count="props.row.vulnerabilities?.moderate"
              /></q-td>
              <q-td class="text-center">
                <npm-audit-chip
                  severity="high"
                  :loading="servicesStore.loadingVulnerabilities"
                  :count="props.row.vulnerabilities?.high"
              /></q-td>
              <q-td class="text-center">
                <npm-audit-chip
                  severity="high"
                  :loading="servicesStore.loadingVulnerabilities"
                  :count="props.row.vulnerabilities?.critical"
              /></q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>

  <NpmAuditDialog ref="refNpmAuditDialog" />
</template>

<script lang="ts" setup>
import { type Service, useServicesStore } from "@/stores/services";
import NpmAuditChip from "@/components/chips/NpmAuditChip.vue";
import BranchChip from "@/components/chips/BranchChip.vue";
import type { QTableProps } from "quasar";
import { ref } from "vue";
import NpmAuditDialog from "@/components/npmAuditDialog/NpmAuditDialog.vue";

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
    name: "mergeRequest",
    label: "Create MR",
    align: "left",
    field: (row) => row.currentGitBranch,
  },
  {
    name: "Info",
    label: "Info",
    align: "center",
    field: (row) => row.vulnerabilities.info,
  },
  {
    name: "Low",
    label: "Low",
    align: "center",
    field: (row) => row.vulnerabilities.low,
  },
  {
    name: "Moderate",
    label: "Moderate",
    align: "center",
    field: (row) => row.vulnerabilities.moderate,
  },
  {
    name: "High",
    label: "High",
    align: "center",
    field: (row) => row.vulnerabilities.high,
  },
  {
    name: "Critical",
    label: "Critical",
    align: "center",
    field: (row) => row.vulnerabilities.critical,
  },
];

const servicesStore = useServicesStore();

const refreshAudit = () => {
  servicesStore.getNpmAuditForAllServices();
};

const doNpmAuditAutoFix = async (params: {
  servicesToFix: string[];
  useForce: boolean;
  pushToOrigin: boolean;
  branch: string;
}) => {
  console.log(params);

  servicesStore.fixingVulnerabilities = true;
  servicesStore.loadingVulnerabilities = true;
  for (const service of params.servicesToFix) {
    await servicesStore.tryAutoFixService(service, {
      branch: params.branch,
      useForce: params.useForce,
      pushToOrigin: params.pushToOrigin,
    });

    await servicesStore.getNpmAuditForService(service);
  }
  servicesStore.fixingVulnerabilities = false;
  servicesStore.loadingVulnerabilities = false;
};
const refNpmAuditDialog = ref(NpmAuditDialog);
const tryAutoFixButtonClick = async () => {
  refNpmAuditDialog.value.showDialog({
    confirmAction: doNpmAuditAutoFix,
    servicesToFix: servicesStore.services.map((s) => {
      return {
        name: s.name,
        fix: s.vulnerabilities
          ? Boolean(
              s.vulnerabilities.info +
                s.vulnerabilities.low +
                s.vulnerabilities.moderate +
                s.vulnerabilities.high +
                s.vulnerabilities.critical,
            )
          : false,
      };
    }),
  });
  //await servicesStore.tryAutoFixAllServices();
};

const createMergeRequest = (service: Service) => {
  window.open(
    `https://${
      service.gitUrl
    }/-/merge_requests/new?merge_request[source_branch]=${
      servicesStore.getServiceStatus(service.name)?.currentGitBranch
    }`,
    "_blank",
  );
};
</script>
