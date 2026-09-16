export class AddCell {
    static readonly type = '[Cell] Add cell';
    constructor(public cellName: string) { }
}

export class ChangeStatus {
    static readonly type = '[Cell] Change status';
    constructor(
        public readonly cellId: number,
        public readonly status: boolean
    ) { }
}
