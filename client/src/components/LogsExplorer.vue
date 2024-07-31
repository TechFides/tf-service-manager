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
    <ag-grid-vue
      ref="agGrid"
      class="ag-theme-alpine-dark"
      :style="`width: 100%; height: ${props.height}px;`"
      :rowData="props.logs"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      @first-data-rendered="onFirstDataRendered"
      @row-data-updated="onRowDataUpdated"
      :suppress-scroll-on-new-data="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridVue } from "ag-grid-vue3";
import type { ColDef } from "ag-grid-community";
import type { Log } from "@/stores/logs";
import LineRenderer from "@/components/agGridRenderers/LineRenderer.vue";
import DateTimeChipCellRenderer from "@/components/agGridRenderers/DateTimeChipCellRenderer.vue";
import ServiceChipCellRenderer from "@/components/agGridRenderers/ServiceChipCellRenderer.vue";

const props = defineProps<{
  logs: Log[];
  height: number;
  clearLogsCallback: () => void;
}>();

const autoScroll = ref(true);
const agGrid = ref<InstanceType<typeof AgGridVue>>(null);

const columnDefs = ref<ColDef[]>([
  {
    field: "ts",
    headerName: "Time",
    maxWidth: 100,
    cellRenderer: DateTimeChipCellRenderer,
    cellStyle: {
      display: "flex",
      alignItems: "center",
    },
  },
  {
    headerName: "Service",
    field: "service",
    cellRenderer: ServiceChipCellRenderer,
    maxWidth: 120,
    cellStyle: {
      display: "flex",
      alignItems: "center",
    },
  },
  {
    field: "line",
    headerName: "Line",
    cellRenderer: LineRenderer,
    cellStyle: {
      display: "flex",
      alignItems: "center",
    },
  },
]);

const defaultColDef = ref({
  flex: 1,
  minWidth: 100,
  sortable: true,
  filter: true,
  resizable: true,
});

const scrollToBottom = () => {
  if (autoScroll.value && agGrid.value) {
    const rowCount = agGrid.value.api.getDisplayedRowCount();
    agGrid.value.api.ensureIndexVisible(rowCount - 1, "bottom");
  }
};

const onFirstDataRendered = () => {
  scrollToBottom();
};

const onRowDataUpdated = () => {
  scrollToBottom();
};
</script>

<style scoped lang="scss">
.logs-container {
  font-family: monospace;
  font-size: 11px;
  p {
    padding: 0;
    margin: 0;
  }
}
.ag-theme-alpine-dark {
  --ag-font-size: 10px;
  --ag-row-height: 30px;
}
</style>
