import { defineStore } from "pinia";

interface FontSizeState {
  fontSize: number;
}

export const useFontSizeStore = defineStore("font-size", {
  persist: true,
  state: () =>
    ({
      fontSize: 10,
    }) as FontSizeState,
  actions: {
    setFontSize(size: number) {
      this.fontSize = size;
    },
  },
});
