<template>
  <q-dialog v-model="show" persistent>
    <div class="confirm-dialog">
      <q-card>
        <q-card-section>
          <div class="confirm-text">{{ title }}</div>
          <pre>{{ ansiHTML(content) }}</pre>
        </q-card-section>
        <div class="confirm-buttons">
          <q-btn
            class="confirm-button"
            :label="cancelBtnLabel"
            outline
            @click="closeDialog"
          />
        </div>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { LogDetailDialogParams } from "@/components/logDetailDialog/logDetailDialogParam";
import ansiHTML from "ansi-html";

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
  width: auto;
}

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
</style>
