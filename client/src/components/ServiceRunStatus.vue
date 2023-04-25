<template>
  <div>
    <q-icon
      v-if="runStatus === 'RUNNING'"
      size="sm"
      color="green"
      name="check_circle_outline"
    />
    <q-icon
      v-else-if="runStatus === 'PENDING'"
      size="sm"
      color="orange-14"
      name="error_outline"
    />
    <q-icon
      v-else-if="runStatus === 'STOPPED'"
      size="sm"
      color="red"
      name="highlight_off"
    />

    <q-chip square color="grey-9" dense> {{ runStatus }}</q-chip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  runStatus?: string;
}>();
</script>

<style scoped lang="scss"></style>
