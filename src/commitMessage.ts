export interface Message {
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
