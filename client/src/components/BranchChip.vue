<template>
  <div v-if="status">
    <q-chip
      square
      color="grey-9"
      size="md"
      :label="`${status.currentGitBranch ?? '-'}${
        status.currentGitBranchAhead || status.currentGitBranchBehind
          ? ` (${status.currentGitBranchAhead}/${status.currentGitBranchBehind})`
          : ''
      }`"
      :class="`branch-chip ${status.currentGitBranch ? 'menu-chip' : ''} ${
        status.currentGitBranchHasChanges ? 'gold-chip' : ''
      }`"
    >
      <q-menu v-if="status.currentGitBranch">
        <q-list style="width: 180px" class="bg-blue-grey-10">
          <q-item>
            <q-item-section>
              <q-item-label overline>Git actions</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item
            v-bind:key="branchTask.name"
            v-for="branchTask of tasksStore.branchTasks"
            clickable
            v-ripple
            v-close-popup
            @click="() => status && branchAction(branchTask.name, status.name)"
          >
            <q-item-section avatar>
              <q-icon size="sm" :name="branchTask.icon" />
            </q-item-section>
            <q-item-section> {{ branchTask.name }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
      <q-tooltip
        v-if="status.currentGitBranchAhead || status.currentGitBranchBehind"
      >
        {{ getCommitsText(status.currentGitBranchAhead, "ahead") }},
        {{ getCommitsText(status.currentGitBranchBehind, "behind") }}
      </q-tooltip>
    </q-chip>
    <ConfirmDialog ref="refConfirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog.vue";
import { useTasksStore } from "@/stores/tasks";
import type { ServiceStatus } from "@/stores/services";

const refConfirmDialog = ref(ConfirmDialog);
const tasksStore = useTasksStore();

defineProps<{
  status?: ServiceStatus;
}>();

const getCommitsText = (value: number, text: string) => {
  return `${value} commit${value === 1 ? "" : "s"} ${text}`;
};

const branchAction = (taskName: string, service: string) => {
  const runTask = () => tasksStore.runTask(taskName, service);
  const task = tasksStore.branchTasks.find(({ name }) => name === taskName);
  if (task) {
    if (task.confirmText) {
      refConfirmDialog.value.showDialog({
        title: task.confirmText,
        confirmAction: runTask,
      });
    } else {
      runTask();
    }
  }
};
</script>

<style scoped lang="scss">
.branch-chip {
  &.menu-chip {
    cursor: pointer;

    &.gold-chip {
      color: #d4af37;
    }
  }
}
</style>
