export class ControllencyItem {
    public params?: any[];
    public fn: (...params: any[]) => Promise<any>;
    public thisObj?: any;
}