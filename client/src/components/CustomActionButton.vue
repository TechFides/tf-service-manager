<template>
  <div v-if="tasks">
    <q-btn
      size="sm"
      color="red"
      icon="edit_square"
      :class="[btnClass !== undefined ? btnClass : null]"
      :label="btnLabel !== undefined ? btnLabel : ''"
      :disable="disableButtonFunction(tasks)"
      class="custom-action-chip menu-chip"
    >
      <q-menu>
        <q-list style="width: auto" class="bg-blue-grey-10">
          <q-item>
            <q-item-section>
              <q-item-label overline>Custom actions</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item
            v-for="task of tasks"
            v-bind:key="task.name"
            clickable
            v-ripple
            v-close-popup
            :disable="disableTaskFunction(task, serviceName)"
            @click="runTaskFunction(task.name, serviceName)"
          >
            <q-item-section avatar>
              <q-icon size="sm" :name="task.icon" />
            </q-item-section>
            <q-item-section> {{ task.name }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import type { Task } from "@/stores/tasks";

defineProps<{
  serviceName: string;
  tasks: Task[];
  disableButtonFunction: (tasks: Task[]) => boolean;
  disableTaskFunction: (task: Task, service: string) => boolean;
  runTaskFunction: (task: string, service: string) => void;
  btnClass?: string;
  btnLabel?: string;
}>();
</script>

<style scoped lang="scss">
.custom-action-chip {
  &.menu-chip {
    cursor: pointer;
  }
}
</style>
