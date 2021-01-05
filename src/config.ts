import { workspace } from 'vscode';

export type CommitType = {
	label: string,
	detail: string
};

export type CommitTypes = Array<CommitType>;

const CONFIG_GROUP_NAME = 'svn-commit.commit';
const CONFIG_TYPES_NAME = 'types';

export interface Config {
  types: CommitTypes,
  autoCommitAfterInput: boolean,
  minSubjectSize: number,
  showScopeInputBox: boolean,
  showBodyInputBox: boolean,
  showFooterInputBox: boolean
}

export const DEFAULT_CONFIG: Config = {
	types: [],
	autoCommitAfterInput: false,
  minSubjectSize: 3,
  showScopeInputBox: true,
  showBodyInputBox: true,
  showFooterInputBox: true
};

export let pluginConfig: Config = DEFAULT_CONFIG;

export function getConfig(): Config {
  const config = workspace.getConfiguration(CONFIG_GROUP_NAME);
  const COMMIT_TYPES: CommitTypes = config.get(CONFIG_TYPES_NAME) || [];

  pluginConfig = {
    types: COMMIT_TYPES,
    autoCommitAfterInput: !!config.get('autoCommitAfterInput'),
    minSubjectSize: config.get('minSubjectSize') || 3,
    showScopeInputBox: !!config.get('showScopeInputBox'),
    showBodyInputBox: !!config.get('showBodyInputBox'),
    showFooterInputBox: !!config.get('showFooterInputBox')
  };

  return pluginConfig;
}
