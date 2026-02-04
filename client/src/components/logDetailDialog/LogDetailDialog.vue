<template>
  <q-dialog v-model="show" persistent>
    <div class="confirm-dialog">
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <div class="dialog-header-text">{{ title }}</div>
        </q-card-section>
        <q-card-section class="dialog-content">
          <vue-json-pretty :data="content" :highlightSelectedNode="false" />
        </q-card-section>
        <q-card-section class="confirm-buttons">
          <q-btn
            class="confirm-button"
            :label="cancelBtnLabel"
            outline
            @click="closeDialog"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { LogDetailDialogParams } from "@/components/logDetailDialog/logDetailDialogParam";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

const title = ref("");
const content = ref("");
const show = ref(false);
const cancelBtnLabel = ref("Close");

const showDialog = (params: LogDetailDialogParams) => {
  title.value = params.title;
  content.value = params.content;

  cancelBtnLabel.value = "Close";
  show.value = true;
};

const closeDialog = () => {
  show.value = false;
};

defineExpose({ showDialog, closeDialog });
</script>

<style lang="scss" scoped>
.confirm-dialog {
  min-width: 500px;
  max-width: 100%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.dialog-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dialog-header {
  padding-bottom: 0;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  max-height: calc(80vh - 180px);
}

.dialog-header-text {
  font-size: 1.25em;
  margin-bottom: 8px;
}

.confirm-buttons {
  display: flex;
  justify-content: flex-end;
}

.confirm-button {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
