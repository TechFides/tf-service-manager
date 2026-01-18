import { defineStore } from "pinia";

interface SettingState {
  gitCheckoutType: string;
  selectedServices: string[];
  ideCommand: string;
}

export const useSettingsStore = defineStore({
  id: "tf-sm-settings",
  persist: true,
  state: () =>
    ({
      gitCheckoutType: "ssh",
      selectedServices: [],
      ideCommand: "code",
    }) as SettingState,

  getters: {},
  actions: {},
});
