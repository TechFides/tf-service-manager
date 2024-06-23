<template>
  <q-chip
    square
    :color="count == undefined || count == 0 ? 'grey-9' : getColorBySeverity()"
    class="q-pl-lg q-pr-lg"
    text-color="white"
  >
    <div v-if="loading && count == undefined">
      <q-spinner color="white" />
    </div>
    <div v-else-if="count == undefined">?</div>
    <div v-else>
      {{ count }}
      <q-icon v-if="count == 0" size="sm" name="check" color="green" />
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
