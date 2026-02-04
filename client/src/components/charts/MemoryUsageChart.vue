<template>
  <q-card flat>
    <q-card-section class="row">
      <div class="text-h6">Memory</div>
      <q-space />
      <div class="q-pt-sm">Total usage: {{ totalUsage }}MB</div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <v-chart class="chart" :option="option" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, provide, ref, watch } from "vue";
import { THEME_KEY } from "vue-echarts";
import type { EChartsOption, LineSeriesOption } from "echarts";
import { MAX_MONITOR_HISTORY, useServicesStore } from "@/stores/services";
import { colors } from "quasar";
import getPaletteColor = colors.getPaletteColor;
import lighten = colors.lighten;

const servicesStore = useServicesStore();
const totalUsage = ref(0);

provide(THEME_KEY, "dark");

const xAxisData: string[] = [];
for (let i = MAX_MONITOR_HISTORY; i > 0; i--) {
  xAxisData.push(`${-i}s`);
}

const option = ref<EChartsOption>({
  tooltip: {
    trigger: "axis",
  },
  animation: false,
  backgroundColor: "transparent",
  legend: {
    data: [],
    top: 0,
    left: 0,
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: xAxisData,
  },
  yAxis: {
    type: "value",
  },
  series: [],
});

const regenerateSeries = () => {
  if (option.value.legend) {
    (option.value.legend as any).data = servicesStore.services.map(
      (service) => {
        return {
          name: service.name.replace("TF_", ""),
          itemStyle: {
            color: lighten(getPaletteColor(service.color), 20),
          },
        };
      },
    );
  }

  option.value.series = [];
  for (const service of servicesStore.services) {
    const seriesColor = lighten(getPaletteColor(service.color), 20);
    (option.value.series as any[]).push({
      name: service.name.replace("TF_", ""),
      type: "line",
      showSymbol: false,
      smooth: true,
      itemStyle: {
        color: seriesColor,
      },
      lineStyle: {
        width: 2,
        color: seriesColor,
      },
      data: [],
    });
  }
};

onMounted(regenerateSeries);
watch(() => servicesStore.services, regenerateSeries);

servicesStore.$subscribe((mutation, state) => {
  let currentTotalUsage = 0;
  for (const serviceMonitor of state.servicesMonitors) {
    const seriesData = option?.value?.series as LineSeriesOption[];
    const series = seriesData?.find(
      (s) => `TF_${s.name}` === serviceMonitor.name,
    );
    if (series) {
      const memData = serviceMonitor.memoryMegaBytes;
      if (memData && memData.length > 0) {
        currentTotalUsage += memData[memData.length - 1]!;
        series.data = memData;
      }
    }
  }
  totalUsage.value = currentTotalUsage;
});
</script>

<style scoped lang="scss">
.chart {
  height: 250px;
}
</style>
