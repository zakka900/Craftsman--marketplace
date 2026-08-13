// Config Metro per monorepo (workspaces npm)
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

// RN 0.86 non ha una variante .web.js di ReactDevToolsSettingsManager (solo
// .ios.js/.android.js): su web la risoluzione fallisce. Redirect verso uno stub
// no-op, solo per la piattaforma web — iOS/Android usano i file nativi originali.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform, ...rest) => {
  if (platform === 'web' && moduleName.endsWith('rndevtools/ReactDevToolsSettingsManager')) {
    return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'web-stubs/ReactDevToolsSettingsManager.js') };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform, ...rest)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
