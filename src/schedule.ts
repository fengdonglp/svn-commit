import { SingleStep, Step } from './steps';

// 执行进度
export enum Signal {
  error,
  cancel,
  back,
  end
}

/**
 * 基本结构，每个任务为一个单元，该任务执行结束后，执行下一个任务
 * 
 */
export class ScheduleLinkList {
  // 正在执行的任务
  private _currentStep: SingleStep = undefined;
  private _headStep: SingleStep = undefined;
  private _tailStep: SingleStep = undefined;

  /**
   * register
   */
  public register(step: Step) {
    if (this._currentStep !== undefined && this._tailStep !== undefined) {
      this._tailStep.next = step;
      step.prev = this._tailStep;
      this._tailStep = step;
    } else {
      this._currentStep = this._headStep = this._tailStep = step;
    }
  }

  public async execute(): Promise<Signal> {
    if (this._currentStep) {
      const signal = await this._currentStep.execute();

      if (signal === Signal.end) {
        this._currentStep = this._currentStep.next;
        return this.execute();
      } else if (signal === Signal.back) {
        this._currentStep = this._currentStep.prev;
        return this.execute();
      } else {
        return signal;
      }
    }

    return Signal.end;
  }

  /**
   * 遍历链表
   */
  private _forEach(fn: (step: Step) => void) {
    let step = this._headStep;
    while (step) {
      fn(step);
      step = step.next;
    }
  }

  public reset() {
    this._forEach((step) => {
      step.reset();
    });
    this._currentStep = this._headStep;
  }

  /**
   * 销毁任务队列
   */
  public destroy() {
    this._forEach((step) => {
      step.reset();
      if (step.prev) {
        step.prev.next = undefined;
      }
      step.prev = undefined;

      if (!step.next) {
        step.next = undefined;
      }
    });

    this._currentStep = this._headStep = this._tailStep = undefined;
  }
}
