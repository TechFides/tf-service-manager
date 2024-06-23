<template>
  <q-chip
    square
    :color="count == undefined || count == 0 ? 'grey' : getColorBySeverity()"
    class="q-pl-lg q-pr-lg"
    text-color="white"
  >
    <div v-if="loading && count == undefined">
      <q-spinner color="primary" />
    </div>
    <div v-else-if="count == undefined">?</div>
    <div v-else>
      {{ count }}
    </div>
  </q-chip>
</template>

<script setup lang="ts">
const props = defineProps<{
  count: number | undefined;
  loading: boolean;
  severity: "info" | "low" | "moderate" | "high" | "critical";
}>();

const getColorBySeverity = (): string => {
  switch (props.severity) {
    case "info":
      return "light-blue";
    case "low":
      return "green";
    case "moderate":
      return "orange";
    case "high":
      return "deep-orange";
    case "critical":
      return "red";
  }
};
</script>
