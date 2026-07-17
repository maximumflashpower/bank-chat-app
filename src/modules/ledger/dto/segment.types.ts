export interface SegmentBalance {
  segmentId: string;
  segmentCode: string;
  segmentName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface SegmentTree extends SegmentBalance {
  children?: SegmentTree[];
}
