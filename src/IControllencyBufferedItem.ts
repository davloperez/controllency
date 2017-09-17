import { IControllencyItem } from "./IControllencyItem";

export interface IControllencyBufferedItem extends IControllencyItem {
    bufferedDate: Date;
    promise: Promise<any>;
    processing: boolean;
}