<template>
  <div>
    <div class="text-right">
      <q-toggle
        v-model="autoScroll"
        color="green"
        label="Autoscroll"
        size="sm"
        class="q-mr-md"
      />
      <q-btn
        class=""
        size="sm"
        color="negative"
        icon="delete"
        label="Clear logs"
        @click="clearLogsCallback"
      />
    </div>
    <div class="logs-container">
      <q-virtual-scroll
        ref="virtualListRef"
        :style="`max-height: ${height}px`"
        :items="logs"
        virtual-scroll-item-size="22"
        v-slot="{ item, index }"
      >
        <div :key="index">
          <q-chip square size="sm" color="grey-9">{{
            item.ts.substring(11, 19)
          }}</q-chip>
          <q-chip
            square
            size="sm"
            :color="item.color"
            class="service-chip text-center"
            >{{ item.service }}</q-chip
          >
          <q-chip v-if="item.info" square size="sm" color="orange-14"
            ><q-icon name="info" size="15px"
          /></q-chip>
          {{}}
          <span v-html="convert.toHtml(item.line)" />
        </div>
      </q-virtual-scroll>
    </div>
    <q-banner v-if="logs.length === 0" rounded class="bg-orange-14 text-white">
      <template v-slot:avatar>
        <q-icon name="error_outline" color="white" />
      </template>
      There is no logs to display
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import type { Log } from "@/stores/logs";
import { ref, watch } from "vue";
import type { QVirtualScroll } from "quasar";

import * as Convert from "ansi-to-html";
const convert = new Convert();

const props = defineProps<{
  logs: Log[];
  height: number;
  clearLogsCallback: () => void;
}>();

const autoScroll = ref(true);
const virtualListRef = ref<QVirtualScroll>(null);
watch(
  () => props.logs,
  () => {
    if (autoScroll.value) {
      virtualListRef.value.scrollTo(props.logs.length);
    }
  }
);
</script>

<style scoped lang="scss">
.logs-container {
  font-family: monospace;
  font-size: 11px;
  .q-chip {
    margin: 1px;
  }
  .service-chip {
    width: 100px;
    ::v-deep(div) {
      display: inline;
      text-align: center;
    }
  }
  p {
    padding: 0;
    margin: 0;
  }
}
</style>
