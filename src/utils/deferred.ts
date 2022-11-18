export class Deferred<T> {
  promise: Promise<T>;
  resolve: (val: T) => void;
  reject: (val: any) => void;
  value: null | T = null;

  constructor() {
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
    this.promise.then((v) => this.value = v)
  }
}