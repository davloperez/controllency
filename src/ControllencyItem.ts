export class ControllencyItem {
    public params?: any[] | any;
    public fn: (...params: any[]) => Promise<any>;
    public thisObj?: any;
}