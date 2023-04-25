<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Pipelines</div>
    </q-card-section>
    <q-separator />
    <q-card-section
      class="row q-pa-sm"
      v-bind:key="service.name"
      v-for="service of services"
    >
      <div class="col">{{ service.name }}</div>
      <div class="col text-center">
        <img :src="service.pipelineBadge" />
      </div>
      <div class="col text-center">
        <img :src="service.coverageBadge" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Service } from "@/stores/services";
defineProps<{
  services: Service[];
}>();
</script>

<style scoped lang="scss"></style>
