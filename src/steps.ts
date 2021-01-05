import { QuickPickItem, window } from 'vscode';
import CommitMessage, { Message } from './commitMessage';
import { CommitTypes } from './config';
import showInputBox, { CustomInputBoxOptions } from './inputBox';
import { Signal } from './schedule';

export type SingleStep = Step | undefined;

// 双向链表结构
export abstract class Step {
  public prev: SingleStep = undefined;
  public next: SingleStep = undefined;
  abstract execute(): Promise<Signal>;
  reset() {};
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

export class SelectCommitTypeStep extends Step {
  private _commitMessage: CommitMessage;
  private _types: CommitTypes;

  constructor(cm: CommitMessage, types: CommitTypes) {
    super();
    this._commitMessage = cm;
    this._types = types;
  }

  async execute() {
    const res = await window.showQuickPick(
      this._types.map(type => new CommitQuickPickItem(type.label, type.detail))
    );

    if (res instanceof CommitQuickPickItem) {
      this._commitMessage.type = res.label;
      return Signal.end;
    }

    return Promise.reject();
  }

  reset() {
    this._commitMessage.type = '';
  }
}

export class ShowInputBoxStep extends Step {
  private _commitMessage: CommitMessage;
  private _field: keyof Message;
  private _options: CustomInputBoxOptions;
  private _originOptions: CustomInputBoxOptions;

  constructor(cm: CommitMessage, field: keyof Message, options: CustomInputBoxOptions) {
    super();
    this._commitMessage = cm;
    this._field = field;
    this._originOptions = Object.assign({}, options);
    this._options = Object.assign({}, options);
  }

  async execute() {
    const [value, signal] = await showInputBox(this._options);
    this._commitMessage[this._field] = value;
    this._options.value = value;
    return signal;
  }

  reset() {
    this._commitMessage[this._field] = '';
    this._options = Object.assign({}, this._originOptions);
  }
}