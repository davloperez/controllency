/**
 * This represents an item that can be pushed to a Controllency object.
 *
 * @export
 * @interface IControllencyItem
 */
export interface IControllencyItem {
    /**
     * Function (that returns a Promise) that will be executed by the Controllency object passing
     * this 'params' and having 'thisObj' context.
     *
     * @memberof IControllencyItem
     */
    fn: (...params: any[]) => Promise<any>;
    /**
     * Parameters (in order) that will be passed to fn function.
     *
     * @type {(any[] | any)}
     * @memberof IControllencyItem
     */
    params?: any[] | any;
    /**
     * The context (value of 'this') that will have fn function.
     *
     * @type {*}
     * @memberof IControllencyItem
     */
    thisObj?: any;
}