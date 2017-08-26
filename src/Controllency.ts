import { ControllencyOptions } from "./ControllencyOptions";
import { ControllencyItem } from "./ControllencyItem";
import { EventEmitter } from "events";
import { ControllencyBufferedItem } from "./ControllencyBufferedItem";

export class Controllency extends EventEmitter {
    private maxConcurrency: number;
    private buffer: ControllencyBufferedItem[];

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
    }

    private setMaxConcurrency(maxConcurrency: number) {
        if (typeof maxConcurrency !== 'number' || Math.trunc(maxConcurrency) !== maxConcurrency || maxConcurrency <= 0) {
            throw new Error('maxConcurrency must by an integer');
        }
        this.maxConcurrency = maxConcurrency;
    }

    private push(item: ControllencyItem | (() => Promise<any>) ) {
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
        this.buffer.push({
            bufferedDate: new Date(),
            fn: item.fn,
            params: item.params,
            thisObj: item.thisObj
        });
    }
}