<template>
  <div class="d-flex align-center">
    <q-chip v-if="params.data.info" square size="sm" color="orange-14">
      <q-icon name="info" size="15px" />
    </q-chip>
    <span v-html="ansiHTML(params.value)" />
  </div>
</template>

<script lang="ts" setup>
import type { ICellRendererParams } from "ag-grid-community";
import ansiHTML from "ansi-html";

type Props = { params: ICellRendererParams };
defineProps<Props>();
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Material+Icons");

.d-flex {
  display: flex;
  align-items: center;
  font-family: "Material Icons", Arial, sans-serif;
}
</style>
