import 'mocha';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Controllency } from "../src/Controllency";
import { ControllencyStatus } from "../src/ControllencyStatus";
use(chaiAsPromised);

it('should be initialized with maxConcurrency = 1', () => {
    let controllency = new Controllency();
    expect(controllency.getMaxConcurrency()).to.be.eql(1);
});

it('should be initialized with currentQuantityProcessing = 0', () => {
    let controllency = new Controllency();
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
});

it('should be initialized with an empty buffer', () => {
    let controllency = new Controllency();
    expect(controllency.getBufferSize()).to.be.eql(0);
});

it('should be initialized with "idle" status', () => {
    let controllency = new Controllency();
    expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
});

it('should have status "idle", then "processing", and finally "idle" after an item is pushed and resolved', (done) => {
    let controllency = new Controllency();
    let fn = function fn(): Promise<any> {
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
    controllency.push(fn);
    expect(controllency.getStatus()).to.be.eql('processing' as ControllencyStatus);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(1);
    controllency.on('resolved', () => {
        expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
        expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
        done();
    });
});

it('should have status "idle", then "processing", and finally "idle" after an item is pushed and rejected', (done) => {
    let controllency = new Controllency();
    let fn = function fn(): Promise<any> {
        return new Promise((resolve, reject) => {
            setImmediate(reject);
        });
    };
    expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
    controllency.push(fn);
    expect(controllency.getStatus()).to.be.eql('processing' as ControllencyStatus);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(1);
    controllency.on('rejected', () => {
        expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
        expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
        done();
    });
});

it('should queue items without start processing them if status is paused', () => {
    let controllency = new Controllency();
    let fnCalledCount = 0;
    let fn = function fn(): Promise<any> {
        fnCalledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(reject);
        });
    };
    expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
    expect(controllency.getBufferSize()).to.be.eql(0);
    controllency.pause();
    expect(controllency.getStatus()).to.be.eql('paused' as ControllencyStatus);
    controllency.push(fn);
    expect(controllency.getStatus()).to.be.eql('paused' as ControllencyStatus);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
    expect(fnCalledCount).to.be.eql(0);
    expect(controllency.getBufferSize()).to.be.eql(1);
    controllency.push(fn);
    controllency.push(fn);
    controllency.push(fn);
    expect(controllency.getStatus()).to.be.eql('paused' as ControllencyStatus);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(0);
    expect(fnCalledCount).to.be.eql(0);
    expect(controllency.getBufferSize()).to.be.eql(4);
});

it('should start processing queue items after resume', () => {
    let controllency = new Controllency();
    let fnCalledCount = 0;
    let fn = function fn(): Promise<any> {
        fnCalledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(reject);
        });
    };
    controllency.pause();
    controllency.push(fn);
    expect(fnCalledCount).to.be.eql(0);
    controllency.resume();
    expect(fnCalledCount).to.be.eql(1);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(1);
    expect(controllency.getBufferSize()).to.be.eql(1);
});

it('should not rebase maxConcurrency if a batch of items are pushed at the same time', (done) => {
    let controllency = new Controllency({ maxConcurrency: 3 });
    let fnCalledCount = 0;
    let fn = function fn(): Promise<any> {
        fnCalledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    controllency.push(fn);
    controllency.push(fn);
    controllency.push(fn);
    controllency.push(fn);
    controllency.push(fn);
    controllency.push(fn);
    expect(fnCalledCount).to.be.eql(3);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(3);
    expect(controllency.getBufferSize()).to.be.eql(6);
    controllency.on('resolved', () => {
        expect(controllency.getCurrentQuantityProcessing()).to.be.lessThan(4);
        if (fnCalledCount === 6 && controllency.getBufferSize() === 0 && controllency.getCurrentQuantityProcessing() === 0) {
            expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
            done();
        }
    });
});

it('should not rebase maxConcurrency if various batches of items are being pushed while they are being resolved', (done) => {
    let controllency = new Controllency({ maxConcurrency: 3 });
    let fnCalledCount = 0;
    let fnPromisesResolved = 0;
    let promiseResolver: (() => void)[] = [];
    let fn = function fn(): Promise<any> {
        fnCalledCount += 1;
        return new Promise((resolve, reject) => {
            promiseResolver.push(resolve);
        });
    };
    controllency.push(fn);
    controllency.push(fn);
    expect(fnCalledCount).to.be.eql(2);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(2);
    expect(controllency.getBufferSize()).to.be.eql(2);
    controllency.push(fn);
    controllency.push(fn);
    expect(fnCalledCount).to.be.eql(3);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(3);
    expect(controllency.getBufferSize()).to.be.eql(4);
    controllency.push(fn);
    controllency.push(fn);
    expect(fnCalledCount).to.be.eql(3);
    expect(controllency.getCurrentQuantityProcessing()).to.be.eql(3);
    expect(controllency.getBufferSize()).to.be.eql(6);
    controllency.on('resolved', () => {
        expect(controllency.getCurrentQuantityProcessing()).to.be.lessThan(4);
        expect(fnCalledCount - fnPromisesResolved).to.be.lessThan(4);
        if (fnCalledCount === 20 && controllency.getBufferSize() === 0 && controllency.getCurrentQuantityProcessing() === 0) {
            expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
            done();
        }
        else {
            if (fnPromisesResolved === 4) { 
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
            }
            if (fnPromisesResolved === 8) { 
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
                controllency.push(fn);
            }
            if (fnPromisesResolved === 19) { 
                controllency.push(fn);
            }
            promiseResolver[fnPromisesResolved]();
            fnPromisesResolved += 1;
        }
    });
    promiseResolver[fnPromisesResolved]();
    fnPromisesResolved += 1;
});

it('should start processing items in the right order', (done) => {
    let controllency = new Controllency({ maxConcurrency: 3 });
    let nextExpectedItemNumber = 0;
    let invalidOrderOccured = false;
    let fn = function fn(itemNumber?: number): Promise<any> {
        if (nextExpectedItemNumber !== itemNumber) {
            invalidOrderOccured = true;
        }
        nextExpectedItemNumber += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 20; counter += 1){
        controllency.push({ fn: fn, params: [counter]});
    }
    controllency.on('resolved', () => {
        if (controllency.getBufferSize() === 0 && controllency.getCurrentQuantityProcessing() === 0) {
            expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
            expect(invalidOrderOccured).to.be.false;
            done();
        }
    });
});

it('should call provided function with the right arguments and "this" value', (done) => {
    let controllency = new Controllency({ maxConcurrency: 3 });
    let nextExpectedItemIndex = 0;
    let errorOccured = false;
    let testCases: any[] = [];
    let fn = function fn(param1?: any, param2?: any, param3?: any): Promise<any> {
        if (this !== testCases[nextExpectedItemIndex].thisObj ||
            param1 !== testCases[nextExpectedItemIndex].params[0] ||
            param2 !== testCases[nextExpectedItemIndex].params[1] ||
            param3 !== testCases[nextExpectedItemIndex].params[2]) {
            errorOccured = true;
        }
        nextExpectedItemIndex += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 20; counter += 1){
        let testCaseItem = { fn: fn, params: [counter, 'a', 'a' + counter], thisObj: { val: counter } };
        testCases.push(testCaseItem);
        controllency.push(testCaseItem);
    }
    controllency.on('resolved', () => {
        if (controllency.getBufferSize() === 0 && controllency.getCurrentQuantityProcessing() === 0) {
            expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
            expect(errorOccured).to.be.false;
            done();
        }
    });
});