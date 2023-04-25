import { defineStore } from "pinia";

interface SettingState {
  gitCheckoutType: string;
  selectedServices: string[];
}

export const useSettingsStore = defineStore({
  id: "tf-sm-settings",
  persist: true,
  state: () =>
    ({
      gitCheckoutType: "ssh",
      selectedServices: [],
    } as SettingState),

  getters: {},
  actions: {},
});
