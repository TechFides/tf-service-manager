<template>
  <div class="d-flex align-center service-chip">
    <q-chip class="chip" square :color="params.data.color" size="sm">{{
      params.value
    }}</q-chip>
  </div>
</template>

<script lang="ts" setup>
import type { ICellRendererParams } from "ag-grid-community";

type Props = { params: ICellRendererParams };
defineProps<Props>();
</script>

<style lang="scss" scoped></style>
