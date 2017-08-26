import { ControllencyItem } from "./ControllencyItem";

export class ControllencyBufferedItem extends ControllencyItem {
    public bufferedDate: Date;
    public promise: Promise<any>;
    public processing: boolean;
}