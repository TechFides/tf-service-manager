<template>
  <div class="d-flex align-center">
    <q-chip v-if="params.data.info" square size="sm" color="orange-14">
      <q-icon name="info" size="15px" />
    </q-chip>
    <q-chip
      v-if="params.data.isJson"
      clickable
      square
      size="sm"
      color="primary"
    >
      <q-icon name="open_in_new" size="15px" @click="openDetail" />
    </q-chip>
    <span v-if="!params.data.isJson" v-html="ansiHTML(params.value)" />
    <span v-else>{{ ansiHTML(params.value) }}</span>
  </div>
</template>

<script lang="ts" setup>
import type { ICellRendererParams } from "ag-grid-community";
import ansiHTML from "ansi-html";
import type { LogDetailDialogParams } from "@/components/logDetailDialog/logDetailDialogParam";

type CustomProps = {
  showDialog: (params: LogDetailDialogParams) => void;
};

type Props = { params: ICellRendererParams & CustomProps };
const props = defineProps<Props>();

const openDetail = () => {
  props.params.showDialog({
    title: "JSON log detail",
    content: props.params.data.line,
  });
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Material+Icons");

.d-flex {
  display: flex;
  align-items: center;
  font-family: "Material Icons", Arial, sans-serif;
}
</style>
