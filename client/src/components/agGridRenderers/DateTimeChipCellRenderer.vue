<template>
  <div class="align-center cell-renderer">
    <q-chip square color="grey-9" :size="(params as any).getSize()">
      {{ params.value.substring(11, 19) }}
    </q-chip>
  </div>
</template>

<script lang="ts" setup>
import type { ICellRendererParams } from "ag-grid-community";

type Props = { params: ICellRendererParams };
defineProps<Props>();
</script>

<style lang="scss">
.cell-renderer {
  .q-chip__content {
    font-size: var(--ag-font-size);
  }
}
</style>
