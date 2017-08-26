export class ControllencyItem{
    public params?: any[];
    public fn: () => Promise<any>;
    public thisObj?: any;
}