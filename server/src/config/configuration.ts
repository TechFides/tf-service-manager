import { readFileSync } from 'fs';
import * as path from 'path';

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

  const directory = configuration.services_directory as string;
  const servicesDirectoryAbs = path.isAbsolute(directory)
    ? path.resolve(directory)
    : path.resolve(`${__dirname}/../../../${directory}`);

  const toServiceFolder = (name: string) => name.toLowerCase().split('_').join('-');

  const expandedServices: Record<string, any>[] = [];
  for (const service of configuration.services) {
    if (service.subservices && Array.isArray(service.subservices)) {
      const { subservices, ...rootService } = service;

      // Ensure rootPath for monorepo root exists; if not provided, derive it
      const derivedRootPath = rootService.rootPath
        ? (path.isAbsolute(rootService.rootPath)
            ? rootService.rootPath
            : path.resolve(servicesDirectoryAbs, rootService.rootPath))
        : path.resolve(servicesDirectoryAbs, toServiceFolder(rootService.name));

      expandedServices.push({
        ...rootService,
        rootPath: derivedRootPath,
        isMonorepoRoot: true,
      });

      for (const sub of service.subservices) {
        expandedServices.push({
          ...sub,
          rootPath: derivedRootPath,
          relativePath: sub.path,
          gitUrl: service.gitUrl,
          defaultGitBranch: service.defaultGitBranch,
          packageManager: service.packageManager,
          npmRunLifecycle: sub.npmRunLifecycle || service.npmRunLifecycle,
          isMonorepoChild: true,
        });
      }
    } else {
      expandedServices.push(service);
    }
  }
  configuration.services = expandedServices;

  return configuration;
};
