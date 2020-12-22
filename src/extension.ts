import { window, ExtensionContext, commands, InputBoxOptions, extensions, env } from 'vscode';
import { getConfig, Config } from './config';
import CommitMessage, { showSelectTypes, showInputMessage } from './process';

let pluginConfig: Config = {
	types: [],
	autoCommitAfterInput: false,
  minSubjectSize: 3,
  showScopeInputBox: true,
  showBodyInputBox: true,
  showFooterInputBox: true
};

const SVN_EXTENSION_ID = 'johnstoncode.svn-scm';

const scopeInputBoxOptions: InputBoxOptions = {
	placeHolder: '请输入<scope>，如果不需要输入，请按 Enter 键跳过',
	validateInput: function (value) {
		if (value.length > 15) {
			return '最长15个字符';
		}

		return;
	}
};

const subjectInputBoxOptions: InputBoxOptions = {
	placeHolder: '请输入 subject，尽量简洁概要，必填',
	validateInput: function (value) {
		if (value.length < pluginConfig.minSubjectSize) {
			return `最短输入${pluginConfig.minSubjectSize}个字符`;
		}

		if (value.length > 100) {
			return '最长输入100个字符';
		}

		return;
	}
};

const bodyInputBoxOptions: InputBoxOptions = {
	placeHolder: '请输入 body'
};

const footerInputBoxOptions: InputBoxOptions = {
	placeHolder: '请输入 footer'
};

export function activate(context: ExtensionContext) {
	function getSvnExtension() {
		const vscodeSvn = extensions.getExtension(SVN_EXTENSION_ID);
		return vscodeSvn;
	}

	if (!getSvnExtension()) {
		return window.showErrorMessage('SVN 插件未安装或者已被禁用，请先开启该插件');
	}

	let disposable = commands.registerCommand('svn-commit.showCommitMessageTemplate', (...args) => {
		const config = getConfig();
		pluginConfig = config;
		const commitMessage = new CommitMessage();
		const showTypesQuickPick = showSelectTypes.bind(null, commitMessage, config.types);
		const showScopeInputBox = showInputMessage.bind(null, commitMessage, 'scope', scopeInputBoxOptions);
		const showSubjectInputBox = showInputMessage.bind(null, commitMessage, 'subject', subjectInputBoxOptions);
		const showBodyInputBox = showInputMessage.bind(null, commitMessage, 'body', bodyInputBoxOptions);
		const showFooterInputBox = showInputMessage.bind(null, commitMessage, 'footer', footerInputBoxOptions);
		const skipProcess = () => Promise.resolve('');

		const process: Array<() => PromiseLike<string>> = [
			showTypesQuickPick,
			config.showScopeInputBox ? showScopeInputBox : skipProcess,
			showSubjectInputBox,
			config.showBodyInputBox ? showBodyInputBox : skipProcess,
			config.showFooterInputBox ? showFooterInputBox : skipProcess
		];

		process.reduce((pre, current) => {
			return pre.then(() => {
				return current();
			});
		}, skipProcess()).then(async () => {
			const message = commitMessage.toString();
			commands.executeCommand('workbench.view.scm');

			const sourceControlManager = (await commands.executeCommand(
        'svn.getSourceControlManager',
        ''
			)) as any;

			if (!sourceControlManager || (sourceControlManager && sourceControlManager.repositories.length === 0)) {
				return window.showErrorMessage('当前工作空间未发现svn版本库');
			}

			const repositories = sourceControlManager.repositories;
			let repository;

			if (args[0]) {
				// 在scm版本控制的菜单栏上点击图标激活命令时，可以获取对应的版本库
				repository = sourceControlManager.getRepository(args[0]);
			} else if (repositories.length === 1) {
				repository = repositories[0];
			}

			// 当工作空间中存在2个及以上的svn版本目录时，拷贝到剪贴板中，由用户自主选择用于哪个版本库
			if (!repository) {
				env.clipboard.writeText(message);
				return window.showInformationMessage('当前工作空间存在多个svn版本目录，提交信息已拷贝到剪贴板');
			}

			// 将输入结果拷贝到提交输入框中
			repository.inputBox.value = message;

			// 输入完成后是否自动提交
			if (config.autoCommitAfterInput) {
				commands.executeCommand('svn.commitWithMessage', repository);
			}
		}).catch(() => {});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
