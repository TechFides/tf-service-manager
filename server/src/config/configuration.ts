import { readFileSync } from 'fs';

const defaultConfig: Record<string, any> = {
  services: [],
  generic_tasks: [],
};

export default () => {
  if (!process.env.SERVICE_MANAGER_CONFIG_FILE) {
    return defaultConfig;
  }
  return JSON.parse(
    readFileSync(process.env.SERVICE_MANAGER_CONFIG_FILE, 'utf8'),
  ) as Record<string, any>;
};
