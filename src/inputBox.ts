import { InputBox, window, QuickInputButtons, ThemeIcon, workspace } from 'vscode';
import { Signal } from './schedule';

export type CustomInputBoxOptions = {
  busy?: boolean,
  enabled?: boolean,
  ignoreFocusOut?: boolean,
  value?: string,
  prompt?: string,
  placeholder?: string,
  password?: boolean,
  step?: number,
  title?: string,
  validationMessage?: string,
  validateInput?(value: string): string | undefined
};

let inputBox: InputBox;

function createInputBox(): InputBox {
  if (inputBox) {
    return inputBox;
  }

  return window.createInputBox();
}

export default function showInputBox(options: CustomInputBoxOptions): Promise<[string, Signal]> {
  let accepted = false;
  return new Promise((resolve) => {
    const inputBox = createInputBox();
    const {
      validateInput = () => undefined,
      ignoreFocusOut = true,
      ...cOptions
    } = options;

    Object.assign(inputBox, cOptions);

    inputBox.ignoreFocusOut = ignoreFocusOut;
    inputBox.buttons = [
      QuickInputButtons.Back,
      // {
      //   iconPath: new ThemeIcon('eye'),
      //   tooltip: 'Preview'
      // }
    ];
    inputBox.onDidAccept(() => {
      if (inputBox.validationMessage !== undefined) {
        // 判断异常则阻止enter关闭弹窗
        inputBox.show();
        return;
      }

      inputBox.hide();
      accepted = true;
      resolve([inputBox.value, Signal.end]);
    });
    inputBox.onDidHide((e) => {
      if (!accepted) {
        // ignoreFocusOut 为 true， 用户主动取消了操作
        resolve(['', Signal.cancel]);
      }
    });
    inputBox.onDidChangeValue(e => {
      const validMsg = validateInput(inputBox.value);
      inputBox.validationMessage = validMsg;
    });
    inputBox.onDidTriggerButton(async (e) => {
      // 返回上一步
      if ((e.iconPath as ThemeIcon).id === 'arrow-left') {
        resolve([inputBox.value, Signal.back]);
      }

      // 预览
      if (e.tooltip === 'Preview') {
        // 打开一个文本进行预览，并添加编辑功能
        // const textDocument = workspace
        // window.showInformationMessage(commitMessage.toString());
      }
    });
    inputBox.show();
  });
}
