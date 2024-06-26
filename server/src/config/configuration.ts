import { readFileSync } from 'fs';

const defaultConfig: Record<string, any> = {
  services_directory: '../../../services',
  services: [],
  generic_tasks: [],
  git_interval: 1,
};

export default () => {
  if (!process.env.SERVICE_MANAGER_CONFIG_FILE) {
    return defaultConfig;
  }
  const configuration = JSON.parse(
    readFileSync('../' + process.env.SERVICE_MANAGER_CONFIG_FILE, 'utf8'),
  ) as Record<string, any>;
  if (!('services_directory' in configuration)) {
    configuration.services_directory = defaultConfig.services_directory;
  }
  if (!('services' in configuration)) {
    configuration.services = defaultConfig.services;
  }
  if (!('generic_tasks' in configuration)) {
    configuration.generic_tasks = defaultConfig.generic_tasks;
  }
  if (!('git_interval' in configuration)) {
    configuration.git_interval = defaultConfig.git_interval;
  }
  return configuration;
};
