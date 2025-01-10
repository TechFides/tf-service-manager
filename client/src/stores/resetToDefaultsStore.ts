import { defineStore } from "pinia";

export const useResetStore = defineStore("resetStore", {
  state: () => ({
    isResetting: false,
  }),
  actions: {
    startReset() {
      this.isResetting = true;
    },
    endReset() {
      this.isResetting = false;
    },
  },
});
