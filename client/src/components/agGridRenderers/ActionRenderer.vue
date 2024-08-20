<template>
  <q-btn
    v-if="params.data.isJson"
    round
    color="primary"
    size="xs"
    icon="open_in_new"
    @click="openDetail"
  />
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import type { ICellRendererParams } from "ag-grid-community";
import type { LogDetailDialogParams } from "@/components/logDetailDialog/logDetailDialogParam";

type CustomProps = {
  showDialog: (params: LogDetailDialogParams) => void;
  isJson: boolean;
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

<style lang="scss" scoped></style>
