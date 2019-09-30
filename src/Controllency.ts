import { IControllencyOptions } from "./IControllencyOptions";
import { IControllencyItem } from "./IControllencyItem";
import { EventEmitter } from "events";
import { IControllencyBufferedItem } from "./IControllencyBufferedItem";
import { ControllencyStatus } from "./ControllencyStatus";

/**
 * Use this class to limit the quantity of concurrent functions (Promises) that can be executed concurrently.
 * If more functions than maxConcurrency are pushed before the first maxConcurrency functions are resolved, they
 * will be stored in a lighweight in-memory queue, and launched as soon as those first function are being resolved.
 *
 * @export
 * @class Controllency
 * @extends {EventEmitter}
 */
export class Controllency extends EventEmitter {
    private maxConcurrency: number;
    private currentQuantityProcessing: number;
    private buffer: IControllencyBufferedItem[];
    private status: ControllencyStatus;

    /**
     * Creates an instance of Controllency.
     * @param {IControllencyOptions} [options]
     * @memberof Controllency
     */
    constructor(options?: IControllencyOptions | number) {
        super();

        if (typeof options === 'number') {
            options = {
                maxConcurrency: options
            };
        } else if (typeof options === 'undefined') {
            options = {
                maxConcurrency: 1
            };
        } else if (typeof options === 'object') {
            options.maxConcurrency = options.maxConcurrency || 1;
        } else {
            throw new Error('"options" must be an object or a number');
        }
        this.buffer = [];
        this.setMaxConcurrency(options.maxConcurrency);
        this.status = 'idle';
        this.currentQuantityProcessing = 0;
    }

    /**
     * Set the maximum quantity of concurrent promises that can be being processed at the same time.
     *
     * @param {number} maxConcurrency
     * @memberof Controllency
     */
    public setMaxConcurrency(maxConcurrency: number): void {
        if (typeof maxConcurrency !== 'number' ||
            Math.trunc(maxConcurrency) !== maxConcurrency || maxConcurrency <= 0) {
            throw new Error('maxConcurrency must be an integer');
        }
        this.maxConcurrency = maxConcurrency;
        this.proceed();
    }

    /**
     * Get the current maximum quantity of concurrent promises that can be being processed at the same time.
     *
     * @returns {number}
     * @memberof Controllency
     */
    public getMaxConcurrency(): number {
        return this.maxConcurrency;
    }

    /**
     * Get the current internal buffer of this Controllency object.
     * The promises that are currently being processed are included in this internal buffer. In other words,
     * this method returns que quantity of waiting functions in adition to the quantity of processing promises.
     *
     * @returns {number}
     * @memberof Controllency
     */
    public getBufferSize(): number {
        return this.buffer.length;
    }

    /**
     * Get the current status of this Controllency object. It can be 'paused', 'processing' or 'idle'.
     *
     * @returns {ControllencyStatus}
     * @memberof Controllency
     */
    public getStatus(): ControllencyStatus {
        return this.status;
    }

    /**
     * Set the current status of this Controllency object to 'paused'. This means that no new functions will
     * be fetched from the waiting internal queue until 'resume()' function is called. You can still continue
     * calling 'push()' function to queue new functions to be executed later.
     *
     * Important Note: all current processing Promises will continue being processed and resolved/rejected.
     *
     * @memberof Controllency
     */
    public pause(): void {
        this.status = 'paused';
    }

    /**
     * Remove the 'paused' status from this Controllency object. This action will cause that the status become
     * 'idle' or 'processing', depending on the state of the internal queue and current processing Promises.
     *
     * Important Note: by calling to this method, it will immediately start processing any available queued function.
     *
     * @memberof Controllency
     */
    public resume(): void {
        this.status = this.currentQuantityProcessing === 0 ? 'idle' : 'processing';
        this.proceed();
    }

    /**
     * Get the current quantity of processing Promises. This value could be maxConcurrency as maximum.
     *
     * @returns {number}
     * @memberof Controllency
     */
    public getCurrentQuantityProcessing(): number {
        return this.currentQuantityProcessing;
    }

    /**
     * Queue a new function to be executed as soon as posible. If the quantity of current processing Promises
     * is less than maxConcurrency, this function will be executed immediately. Else, it will be queued in-memory
     * to be executed as soon as posible (the order is preserved).
     *
     * You can pass directly the reference to the function to be executed, or you can pass the an object with
     * the function, the paremeters to execute that function, and the value for 'this' inside that function.
     *
     * @param {(ControllencyItem | (() => Promise<any>))} item
     * @memberof Controllency
     */
    public push(item: IControllencyItem | (() => Promise<any>)): void {
        if (typeof item === 'function') {
            item = {
                fn: item
            };
        }
        if (typeof item !== 'object') {
            throw new Error('"item" must be an object or a function');
        }
        if (!Array.isArray(item.params)) {
            item.params = (typeof item.params === 'undefined') ? [] : [item.params];
        }
        if (typeof item.fn !== 'function') {
            throw new Error('"fn" must be a function');
        }
        const bufferedItem: IControllencyBufferedItem = {
            bufferedDate: new Date(),
            fn: item.fn,
            params: item.params,
            processing: true,
            promise: null,
            thisObj: item.thisObj
        };
        this.buffer.push(bufferedItem);
        this.proceed();
    }

    private proceed(): void {
        if (this.maxConcurrency <= this.currentQuantityProcessing || this.status === 'paused') {
            return;
        }
        const quantityToStart = Math.min(
            this.maxConcurrency - this.currentQuantityProcessing,
            this.buffer.length - this.currentQuantityProcessing);
        const itemsToStart = this.buffer.slice(
            this.currentQuantityProcessing,
            this.currentQuantityProcessing + quantityToStart);
        this.currentQuantityProcessing += quantityToStart;
        this.status = this.currentQuantityProcessing === 0 ? 'idle' : 'processing';
        itemsToStart.forEach(this.startItem.bind(this));
    }

    private startItem(bufferedItem: IControllencyBufferedItem): void {
        bufferedItem.promise = Promise.resolve(bufferedItem.fn.apply(bufferedItem.thisObj, bufferedItem.params));
        bufferedItem.promise.then(
            this.onPromiseResolved.bind(this, bufferedItem),
            this.onPromiseRejected.bind(this, bufferedItem));
    }

    private onPromiseResolved(bufferedItem: IControllencyBufferedItem, result: any): void {
        this.currentQuantityProcessing -= 1;
        this.buffer.splice(this.buffer.indexOf(bufferedItem), 1);
        if (this.currentQuantityProcessing === 0 && this.status !== 'paused') {
            this.status = 'idle';
        }
        this.proceed();
        this.emit('resolved', result, bufferedItem);
    }

    private onPromiseRejected(bufferedItem: IControllencyBufferedItem, reason: any): void {
        this.currentQuantityProcessing -= 1;
        this.buffer.splice(this.buffer.indexOf(bufferedItem), 1);
        if (this.currentQuantityProcessing === 0 && this.status !== 'paused') {
            this.status = 'idle';
        }
        this.proceed();
        this.emit('rejected', reason, bufferedItem);
    }
}