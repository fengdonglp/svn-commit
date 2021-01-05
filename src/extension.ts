import { window, ExtensionContext, commands, extensions, env } from 'vscode';
import CommitMessage from './commitMessage';
import { getConfig, pluginConfig } from './config';
import { ScheduleLinkList, Signal } from './schedule';
import {
	scopeInputBoxOptions,
	subjectInputBoxOptions,
	bodyInputBoxOptions,
	footerInputBoxOptions
} from './stepInputBoxOptions';
import { SelectCommitTypeStep, ShowInputBoxStep } from './steps';

// 依赖于第三方svn插件的插件id
const SVN_EXTENSION_ID = 'johnstoncode.svn-scm';

let schedule: ScheduleLinkList | null;

function getSvnExtension() {
	const vscodeSvn = extensions.getExtension(SVN_EXTENSION_ID);
	return vscodeSvn;
}

export function activate(context: ExtensionContext) {
	if (!getSvnExtension()) {
		return window.showErrorMessage('SVN 插件未安装或者已被禁用，请先开启该插件');
	}

	let disposable = commands.registerCommand('svn-commit.showCommitMessageTemplate', async (...args) => {
		if (schedule) {
			schedule.destroy();
		}
		
		const config = getConfig();

		schedule = new ScheduleLinkList();
		const commitMessage = new CommitMessage();

		async function complete() {
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
		}

		schedule.register(new SelectCommitTypeStep(commitMessage, config.types));
		if (pluginConfig.showScopeInputBox) {
			schedule.register(new ShowInputBoxStep(commitMessage, 'scope', scopeInputBoxOptions));
		}
		schedule.register(new ShowInputBoxStep(commitMessage, 'subject', subjectInputBoxOptions));
		if (pluginConfig.showBodyInputBox) {
			schedule.register(new ShowInputBoxStep(commitMessage, 'body', bodyInputBoxOptions));
		}
		if (pluginConfig.showFooterInputBox) {
			schedule.register(new ShowInputBoxStep(commitMessage, 'footer', footerInputBoxOptions));
		}

		const result = await schedule.execute();

		if (result === Signal.end) {
			await complete();
		}

		try {
			schedule.destroy();
			schedule = null;
		} catch (error) {
			console.log('error');
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
