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

it('should be initialized with an empty buffer', () => { 
    let controllency = new Controllency();
    expect(controllency.getBufferSize()).to.be.eql(0);
});

it('should be initialized with "idle" status', () => { 
    let controllency = new Controllency();
    expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
});

it('should have status "idle", then "processing", and finally "idle" after an item is pushed and processed', (done) => { 
    let controllency = new Controllency();
    let fn = function fn(): Promise<any> {
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
    controllency.push(fn);
    expect(controllency.getStatus()).to.be.eql('processing' as ControllencyStatus);
    controllency.on('resolved', () => { 
        expect(controllency.getStatus()).to.be.eql('idle' as ControllencyStatus);
        done();
    })
});