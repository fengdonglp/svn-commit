import { InputBoxOptions, QuickPickItem, window } from 'vscode';
import { CommitTypes } from './config';

interface Message {
  type: string,
  scope: string,
  subject: string,
  body: string,
  footer: string
}

export default class CommitMessage implements Message {
  constructor(
    public type: string = '',
    public scope: string = '',
    public subject: string = '',
    public body: string = '',
    public footer: string = ''
  ) {}

  toString () {
    return this.type +
      (this.scope ? `(${this.scope})` : '') +
      ': ' +
      this.subject +
      (
        this.body ? '\n\n' + this.body : ''
      ) +
      (
        this.footer ? '\n\n' + this.footer : ''
      );
  }
}

class CommitQuickPickItem implements QuickPickItem {
	constructor(public readonly prefix: string, public readonly desc: string) {}

	get label(): string {
		return this.prefix;
	}

	get detail(): string {
		return this.desc;
	}
}

export async function showSelectTypes(cm: CommitMessage, types: CommitTypes) {
  const res = await window.showQuickPick(types.map(type => new CommitQuickPickItem(type.label, type.detail)));
  if (res instanceof CommitQuickPickItem) {
    cm.type = res.label;
    return res.label;
  }
  return Promise.reject();
}

export async function showInputMessage(cm: CommitMessage, field: keyof(Message), options: InputBoxOptions) {
  const value = await window.showInputBox(options);
  // 通过 Esc 或者点击空白处退出
  if (value === undefined) {
    return Promise.reject();
  }
  cm[field] = value;
  return value;
}
