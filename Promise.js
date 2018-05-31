const PENDING = 'pending';
const FULFILL = 'fulfill';
const REJECT = 'reject';



/**
 * 状态机实现
 */
class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.resolveCallbacks = [];
        this.rejectCallbacks = [];

        const resolve = (value) => {
            if (value instanceof Promise) {
                return value.then(resolve, reject);
            }

            // according the promise a plus standard 
            // onFulFill and  onReject excute asynchronously
            setTimeout(() => {
                console.log('resolving...')
                if (this.status === PENDING) {
                    this.status = FULFILL;
                    this.value = value;
                    this.resolveCallbacks.forEach((cb) => { cb(this.value) });
                }
            })
        }
        const reject = (reason) => {
            setTimeout(() => {
                if (this.status === PENDING) {
                    this.status = REJECT;
                    this.value = reason;
                    this.rejectCallbacks.forEach((cb) => { cb(this.value) });
                }
            })

        }
        executor(resolve, reject);
    }
    // then 成员方法
    // 要求返回一个promise

    then(onResolved, onRejected) {
        const _this = this;
        onResolved = typeof onResolved === 'function' ? onResolved : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : value => value;

        /**
         *  判断当前的promise处于什么状态
         */
        if (_this.status === FULFILL) {
            //根据规范then执行之后要返回一个promise;
            return new Promise((resolve, reject) => {
                try {
                    const x = onResolved(_this.value);
                    if (x instanceof Promise) {
                        x.then(resolve, reject);
                    }
                    resolve(x);//作为新的promise的结果
                } catch (err) {
                    reject(err)
                }
            });
        }
        if (_this.status === REJECT) {
            onRejected(_this.value);
            return new Promise((resolve, reject) => {
                try {
                    const x = onRejected(_this.value);
                    if (x instanceof Promise) {
                        x.then(resolve, reject);
                    }
                } catch (err) {
                    reject(err)
                }
            });
        }

        //如果处于pending状态，先把回调函数保存起来
        if (_this.status === PENDING) {
            console.log('pending...')
            return new Promise((resolve, reject) => {
                _this.resolveCallbacks.push((resolve, reject) => {
                    console.log('call back')
                    console.log(resolve)
                    try {
                        const x = onResolved(_this.value);
                        if (x instanceof Promise) {
                            x.then(resolve, reject);
                        }
                    } catch (err) {
                        reject(err);
                    }
                });

                _this.rejectCallbacks.push((resolve, reject) => {
                    try {
                        const x = onRejected(_this.value);
                        if (x instanceof Promise) {
                            x.then(resolve, reject);
                        }
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        }
    }

    catch(onRejected) {
        const _this = this;
        return _this.then(null, onRejected)
    }

}


const p = new Promise((resolve, reject) => {
    // resolve(123)
    setTimeout(() => {
        resolve('data to resolve')
    }, 1)
});

p.then((data) => {
    console.log('then:' + data)
})


function resolvePromise(promise2, x, resolve, reject) {
    var then
    var thenCalledOrThrow = false

    if (promise2 === x) { // 对应标准2.3.1节
        return reject(new TypeError('Chaining cycle detected for promise!'))
    }

    if (x instanceof Promise) { // 对应标准2.3.2节
        // 如果x的状态还没有确定，那么它是有可能被一个thenable决定最终状态和值的
        // 所以这里需要做一下处理，而不能一概的以为它会被一个“正常”的值resolve
        if (x.status === 'pending') {
            x.then(function (value) {
                resolvePromise(promise2, value, resolve, reject)
            }, reject)
        } else { // 但如果这个Promise的状态已经确定了，那么它肯定有一个“正常”的值，而不是一个thenable，所以这里直接取它的状态
            x.then(resolve, reject)
        }
        return
    }

    if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) { // 2.3.3
        try {

            // 2.3.3.1 因为x.then有可能是一个getter，这种情况下多次读取就有可能产生副作用
            // 即要判断它的类型，又要调用它，这就是两次读取
            then = x.then
            if (typeof then === 'function') { // 2.3.3.3
                then.call(x, function rs(y) { // 2.3.3.3.1
                    if (thenCalledOrThrow) return // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                    thenCalledOrThrow = true
                    return resolvePromise(promise2, y, resolve, reject) // 2.3.3.3.1
                }, function rj(r) { // 2.3.3.3.2
                    if (thenCalledOrThrow) return // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                    thenCalledOrThrow = true
                    return reject(r)
                })
            } else { // 2.3.3.4
                resolve(x)
            }
        } catch (e) { // 2.3.3.2
            if (thenCalledOrThrow) return // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
            thenCalledOrThrow = true
            return reject(e)
        }
    } else { // 2.3.4
        resolve(x)
    }
}