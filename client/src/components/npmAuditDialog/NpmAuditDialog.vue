<template>
  <q-dialog v-model="show" class="dialog-container">
    <div class="dialog-container">
      <q-card>
        <q-card-section>
          <div class="text-h4">Try autofix</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row">
            <div class="col">
              <div class="text-h5">Fix parameters</div>
              <div class="row">
                <q-toggle
                  v-model="useForce"
                  label="use --force"
                  checked-icon="check"
                  unchecked-icon="clear"
                />
              </div>
              <div class="row">
                <q-toggle
                  v-model="pushToOrigin"
                  label="Push to origin"
                  checked-icon="check"
                  unchecked-icon="clear"
                />
              </div>
              <div class="row">
                <div class="col">
                  <q-input
                    v-model="branchName"
                    label="Branch Name"
                    filled
                    dense
                  />
                </div>
              </div>
            </div>
          </div>
          <q-separator class="q-ma-md" />
          <div class="row">
            <div class="col">
              <div class="text-h5">Services to fix</div>

              <div
                class="row"
                v-for="service in servicesToFix"
                v-bind:key="service.name"
              >
                <q-toggle
                  v-model="service.fix"
                  :label="service.name"
                  checked-icon="check"
                  unchecked-icon="clear"
                />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="justify-end flex">
          <q-btn
            class="q-mr-md"
            :label="cancelBtnLabel"
            outline
            @click="closeDialog"
          />
          <q-btn :label="confirmBtnLabel" outline @click="confirmDialog" />
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { NpmAuditDialogParams } from "@/components/npmAuditDialog/npmAuditDialogParams";

const defaultCancelBtnLabel = "No";
const defaultConfirmBtnLabel = "Yes";
const cancelBtnLabel = ref(defaultCancelBtnLabel);
const confirmBtnLabel = ref(defaultConfirmBtnLabel);

const show = ref(false);
const servicesToFix = ref<{ name: string; fix: boolean }[]>([]);
let confirmAction: (params: {
  servicesToFix: string[];
  useForce: boolean;
  pushToOrigin: boolean;
  branch: string;
}) => void;

const pushToOrigin = ref(false);
const useForce = ref(false);
const branchName = ref<string>("");

const showDialog = (params: NpmAuditDialogParams) => {
  if (params) {
    confirmAction = params.confirmAction;
    branchName.value = `pckg-audit-fix-${new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-")}`;
    if (params.servicesToFix) {
      servicesToFix.value = params.servicesToFix.map((s) => {
        return {
          name: s.name,
          fix: s.fix,
        };
      });
    }
  }
  show.value = true;
};

const closeDialog = () => {
  show.value = false;
};

const confirmDialog = () => {
  confirmAction({
    useForce: useForce.value,
    pushToOrigin: pushToOrigin.value,
    servicesToFix: servicesToFix.value.filter((s) => s.fix).map((s) => s.name),
    branch: branchName.value,
  });
  closeDialog();
};

defineExpose({
  showDialog,
  closeDialog,
});
</script>

<style lang="scss" scoped>
.dialog-container {
  width: 1200px;
}
</style>
