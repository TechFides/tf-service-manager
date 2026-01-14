<template>
  <q-page class="q-pa-md"
    ><q-card flat
      ><q-card-section class="text-h4">Settings</q-card-section>

      <q-separator />
      <q-card-section>
        <div class="text-h6">Git checkout type</div>
        <div class="q-gutter-sm">
          <q-radio
            v-model="settingsStore.gitCheckoutType"
            val="ssh"
            label="ssh"
          />
          <q-radio
            v-model="settingsStore.gitCheckoutType"
            val="https"
            label="https"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-h6">IDE Command</div>
        <div class="q-gutter-sm q-pt-sm">
          <q-input
            v-model="settingsStore.ideCommand"
            outlined
            dense
            label="Command to open IDE (e.g. code, webstorm)"
            placeholder="code"
            style="max-width: 400px"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();
</script>
<style scoped lang="scss"></style>
