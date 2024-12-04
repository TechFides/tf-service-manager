<template>
  <div>
    <LogDetailDialog ref="logDetailDialog" />
    <div class="text-right">
      <div class="font-size-controls q-mx-md">
        <span>Font Size:</span>
        <q-btn
          size="sm"
          color="primary"
          icon="remove"
          @click="decreaseFontSize"
          :disable="fontSize <= 10"
        />
        <q-btn
          size="sm"
          color="primary"
          icon="add"
          @click="increaseFontSize"
          :disable="fontSize >= 20"
        />
      </div>
      <q-toggle
        v-model="autoScroll"
        color="green"
        label="Autoscroll"
        size="sm"
        class="q-mr-md"
      />
      <q-btn
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
      :style="`width: 100%; height: ${props.height}px; --ag-font-size: ${fontSize}px; --ag-row-height: ${rowHeight}px;`"
      :rowData="props.logs"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      @first-data-rendered="onFirstDataRendered"
      @row-data-updated="onRowDataUpdated"
      @body-scroll="onBodyScroll"
      :suppress-scroll-on-new-data="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, watch } from "vue";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridVue } from "ag-grid-vue3";
import { type ColDef } from "ag-grid-community";
import type { Log } from "@/stores/logs";
import LineRenderer from "@/components/agGridRenderers/LineRenderer.vue";
import DateTimeChipCellRenderer from "@/components/agGridRenderers/DateTimeChipCellRenderer.vue";
import ServiceChipCellRenderer from "@/components/agGridRenderers/ServiceChipCellRenderer.vue";
import "ag-grid-community/styles/ag-theme-material.css";
import { useFontSizeStore } from "@/stores/fontSize";
import stripAnsi from "strip-ansi";
import LogDetailDialog from "@/components/logDetailDialog/LogDetailDialog.vue";

const props = defineProps<{
  logs: Log[];
  height: number;
  clearLogsCallback: () => void;
  showServiceName: boolean;
}>();

const autoScroll = ref(true);
const agGrid = ref<InstanceType<typeof AgGridVue>>(null);

const fontSizeStore = useFontSizeStore();
const fontSize = ref(fontSizeStore.fontSize);
const rowHeight = ref(30);

const logDetailDialog = ref<InstanceType<typeof LogDetailDialog> | null>(null);

const getChipSize = () => {
  return fontSize.value >= 20
    ? "lg"
    : fontSize.value >= 14
      ? "md"
      : fontSize.value >= 11
        ? "sm"
        : "xs";
};

const columnDefs = ref<ColDef[]>([
  {
    field: "ts",
    headerName: "Time",
    cellRenderer: DateTimeChipCellRenderer,
    cellRendererParams: {
      getSize: getChipSize,
    },
    cellStyle: {
      display: "flex",
      alignItems: "center",
    },
  },
  {
    headerName: "Service",
    field: "service",
    cellRenderer: ServiceChipCellRenderer,
    cellRendererParams: {
      getSize: getChipSize,
    },
    cellStyle: {
      display: "flex",
      alignItems: "center",
    },
    hide: !props.showServiceName,
  },
  {
    field: "line",
    headerName: "Line",
    cellRenderer: LineRenderer,
    cellStyle: {
      display: "flex",
      alignItems: "center",
    },
    cellRendererParams: {
      showDialog: (params: { value: string }) => {
        if (logDetailDialog.value) {
          logDetailDialog.value.showDialog(params);
        }
      },
    },
    valueFormatter: (params) => stripAnsi(params.value),
  },
]);

const defaultColDef = ref({
  flex: 1,
  minWidth: 120,
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
  agGrid.value.api.autoSizeColumns(["ts", "service"]);
  scrollToBottom();
};

const onBodyScroll = () => {
  if (agGrid.value) {
    const gridContainer = agGrid.value.$el.querySelector(".ag-body-viewport");

    if (gridContainer) {
      const scrollTop = gridContainer.scrollTop;
      const scrollHeight = gridContainer.scrollHeight;
      const clientHeight = gridContainer.clientHeight;

      autoScroll.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
    }
  }
};

const increaseFontSize = () => {
  fontSize.value += 1;
  fontSizeStore.setFontSize(fontSize.value);
  updateRowHeight();
};

const decreaseFontSize = () => {
  fontSize.value = Math.max(fontSize.value - 1, 6);
  fontSizeStore.setFontSize(fontSize.value);
  updateRowHeight();
};

const updateRowHeight = () => {
  rowHeight.value = fontSize.value * 3;
};

watch(
  () => fontSizeStore.fontSize,
  (newFontSize) => {
    fontSize.value = newFontSize;
  },
);

onMounted(() => {
  updateRowHeight();

  if (agGrid.value) {
    const gridContainer = agGrid.value.$el.querySelector(".ag-body-viewport");
    if (gridContainer) {
      gridContainer.addEventListener("scroll", onBodyScroll);
    }
  }
});
</script>

<style lang="scss">
.ag-theme-material-dark {
  .ag-row {
    border-bottom: transparent !important;
  }
}

.font-size-controls {
  display: flex;
  align-items: center;
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
