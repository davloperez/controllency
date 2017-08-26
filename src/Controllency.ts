import { ControllencyOptions } from "./ControllencyOptions";
import { ControllencyItem } from "./ControllencyItem";
import { EventEmitter } from "events";
import { ControllencyBufferedItem } from "./ControllencyBufferedItem";
import { ControllencyStatus } from "./ControllencyStatus";

export class Controllency extends EventEmitter {
    private maxConcurrency: number;
    private buffer: ControllencyBufferedItem[];
    private status: ControllencyStatus;

    constructor(options?: ControllencyOptions) {
        super();
        if (typeof options === 'undefined') {
            options = {
                maxConcurrency: 1
            };
        } else if (typeof options === 'object') {
            options.maxConcurrency = options.maxConcurrency || 1;
        } else {
            throw new Error('"options" must be an object');
        }
        this.setMaxConcurrency(options.maxConcurrency);
        this.buffer = [];
        this.status = 'idle';
    }

    public setMaxConcurrency(maxConcurrency: number): void {
        if (typeof maxConcurrency !== 'number' || Math.trunc(maxConcurrency) !== maxConcurrency || maxConcurrency <= 0) {
            throw new Error('maxConcurrency must by an integer');
        }
        this.maxConcurrency = maxConcurrency;
    }
    public getMaxConcurrency(): number {
        return this.maxConcurrency;
    }
    public getBufferSize(): number{
        return this.buffer.length;
    }
    public getStatus(): ControllencyStatus{
        return this.status;
    }
    public pause(): void{
        this.status = 'paused';
    }
    public resume(): void{
        this.status = this.buffer.length === 0 ? 'idle' : 'processing';
    }

    public push(item: ControllencyItem | (() => Promise<any>)): void {
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
        let promise = Promise.resolve(item.fn.apply(item.thisObj, item.params));
        let bufferedItem: ControllencyBufferedItem = {
            bufferedDate: new Date(),
            promise: promise,
            fn: item.fn,
            params: item.params,
            thisObj: item.thisObj,
            processing: true
        };
        this.buffer.push(bufferedItem);
        this.status = 'processing';
        promise.then(this.onPromiseResolved.bind(this, bufferedItem), this.onPromiseRejected.bind(this, bufferedItem));
    }

    private onPromiseResolved(bufferedItem: ControllencyBufferedItem, result: any): void {
        this.buffer.splice(this.buffer.indexOf(bufferedItem), 1);
        if (this.buffer.length === 0) {
            this.status = 'idle';
        }
        this.emit('resolved', result, bufferedItem);
    }

    private onPromiseRejected(bufferedItem: ControllencyBufferedItem, reason: any): void {
        this.buffer.splice(this.buffer.indexOf(bufferedItem), 1);
        if (this.buffer.length === 0) {
            this.status = 'idle';
        }
        this.emit('rejected', reason, bufferedItem);
    }
}