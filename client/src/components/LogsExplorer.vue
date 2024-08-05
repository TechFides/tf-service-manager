<template>
  <div>
    <div class="text-right">
      <div class="font-size-controls q-mx-md">
        <span>Font Size: </span>
        <q-btn
          size="sm"
          color="primary"
          icon="remove"
          @click="decreaseFontSize"
        />
        <q-btn size="sm" color="primary" icon="add" @click="increaseFontSize" />
      </div>
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
      class="ag-theme-material-dark"
      :style="`width: 100%; height: ${props.height}px; --ag-font-size: ${fontSize}px;`"
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
import { ref, watch } from "vue";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridVue } from "ag-grid-vue3";
import type { ColDef } from "ag-grid-community";
import type { Log } from "@/stores/logs";
import LineRenderer from "@/components/agGridRenderers/LineRenderer.vue";
import DateTimeChipCellRenderer from "@/components/agGridRenderers/DateTimeChipCellRenderer.vue";
import ServiceChipCellRenderer from "@/components/agGridRenderers/ServiceChipCellRenderer.vue";
import "ag-grid-community/styles/ag-theme-material.css"; // Import the new theme
import { useFontSizeStore } from "@/stores/fontSize";

const props = defineProps<{
  logs: Log[];
  height: number;
  clearLogsCallback: () => void;
}>();

const autoScroll = ref(true);
const agGrid = ref<InstanceType<typeof AgGridVue>>(null);

const fontSizeStore = useFontSizeStore();
const fontSize = ref(fontSizeStore.fontSize);

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

const increaseFontSize = () => {
  fontSize.value += 1;
  fontSizeStore.setFontSize(fontSize.value);
};

const decreaseFontSize = () => {
  fontSize.value = Math.max(fontSize.value - 1, 6); // Prevent font size from getting too small
  fontSizeStore.setFontSize(fontSize.value);
};

watch(
  () => fontSizeStore.fontSize,
  (newFontSize) => {
    fontSize.value = newFontSize;
  },
);
</script>

<style scoped lang="scss">
.ag-theme-material-dark {
  --ag-font-size: 10px;
  --ag-row-height: 30px;
}

.font-size-controls {
  display: flex;
  align-items: center;
}

.ag-theme-material-dark .ag-cell {
  font-size: var(--ag-font-size);
}

.text-right {
  display: flex;
  margin-bottom: 8px;
  align-items: center;
  justify-content: end;
}

.font-size-controls {
  gap: 8px;
}
</style>
