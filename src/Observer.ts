export type Subscription<T> = (x: T) => void;

export class Observer<T> {
  subscriptions: Subscription<T>[] = [];
  value_?: T;

  constructor(x?: T) {
    this.value_ = x;
  }

  subscribe(func: Subscription<T>, initialize = false) {
    this.subscriptions.push(func);
    if (initialize) {
      func(this.value_);
    }

    return () => {
      const index = this.subscriptions.indexOf(func);
      if (index >= 0) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  set(x: T) {
    this.value_ = x;
    for (let i = this.subscriptions.length - 1; i >= 0; i--) {
      this.subscriptions[i](x);
    }
  }
}
