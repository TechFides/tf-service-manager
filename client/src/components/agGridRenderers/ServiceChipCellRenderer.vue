<template>
  <div class="align-center cell-renderer">
    <q-chip class="chip" square :color="params.data.color" size="sm">
      {{ params.value }}
    </q-chip>
  </div>
</template>

<script lang="ts" setup>
import type { ICellRendererParams } from "ag-grid-community";

type Props = { params: ICellRendererParams };
defineProps<Props>();
</script>

<style lang="scss" scoped>
.cell-renderer {
  .q-chip__content {
    font-size: var(--ag-font-size);
  }
}
</style>
