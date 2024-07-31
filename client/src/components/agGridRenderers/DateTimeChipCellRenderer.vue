<template>
  <div class="d-flex align-center centered-chip">
    <q-chip square color="grey-9" size="sm">{{
      params.value.substring(11, 19)
    }}</q-chip>
  </div>
</template>

<script lang="ts" setup>
import type { ICellRendererParams } from "ag-grid-community";

type Props = { params: ICellRendererParams };
defineProps<Props>();
</script>

<style lang="scss" scoped></style>
