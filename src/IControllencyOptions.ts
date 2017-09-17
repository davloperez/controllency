/**
 * Options object that can be used to initially configure an instance of Controllency.
 *
 * @export
 * @interface IControllencyOptions
 */
export interface IControllencyOptions {
    /**
     * Maximum quantity of concurrent promises that can be executing at the same time.
     *
     * @type {number}
     * @memberof IControllencyOptions
     */
    maxConcurrency: number;
}