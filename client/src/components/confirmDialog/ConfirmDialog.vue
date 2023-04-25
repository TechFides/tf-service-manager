<template>
  <q-dialog v-model="show">
    <div class="confirm-dialog">
      <q-card>
        <q-card-section>
          <div class="confirm-text">{{ title }}</div>
        </q-card-section>
        <div class="confirm-buttons">
          <q-btn
            class="confirm-button"
            :label="cancelBtnLabel"
            outline
            @click="closeDialog"
          />
          <q-btn
            class="confirm-button"
            :label="confirmBtnLabel"
            outline
            @click="confirmDialog"
          />
        </div>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { ConfirmDialogParams } from "./confirmDialogParams";

const title = ref("");
const defaultCancelBtnLabel = "No";
const defaultConfirmBtnLabel = "Yes";
const cancelBtnLabel = ref(defaultConfirmBtnLabel);
const confirmBtnLabel = ref(defaultConfirmBtnLabel);
const show = ref(false);
let confirmAction: () => void;

const showDialog = (params: ConfirmDialogParams) => {
  if (params) {
    title.value = params.title;
    confirmAction = params.confirmAction;
    cancelBtnLabel.value = params.cancelBtnLabel
      ? params.cancelBtnLabel
      : defaultCancelBtnLabel;
    confirmBtnLabel.value = params.confirmBtnLabel
      ? params.confirmBtnLabel
      : defaultConfirmBtnLabel;
  }
  show.value = true;
};

const closeDialog = () => {
  show.value = false;
};

const confirmDialog = () => {
  confirmAction();
  closeDialog();
};

defineExpose({
  showDialog,
  closeDialog,
});
</script>

<style lang="scss" scoped>
.confirm-dialog {
  width: 500px;

  .confirm-text {
    font-size: 1.25em;
  }

  .confirm-buttons {
    display: flex;
    justify-content: end;
  }

  .confirm-button {
    margin-right: 15px;
    margin-bottom: 15px;
  }
}
</style>
