import { pluginConfig } from './config';
import { CustomInputBoxOptions } from './inputBox';

export const scopeInputBoxOptions: CustomInputBoxOptions = {
	title: 'scope',
	placeholder: '请输入<scope>，如果不需要输入，请按 Enter 键跳过',
	validateInput: function (value) {
		if (value.length > 15) {
			return '最长15个字符';
		}

		return;
	}
};

export const subjectInputBoxOptions: CustomInputBoxOptions = {
	title: 'subject',
	placeholder: '请输入 subject，尽量简洁概要，必填',
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

export const bodyInputBoxOptions: CustomInputBoxOptions = {
	title: 'body',
	placeholder: '请输入 body'
};

export const footerInputBoxOptions: CustomInputBoxOptions = {
	title: 'footer',
	placeholder: '请输入 footer'
};