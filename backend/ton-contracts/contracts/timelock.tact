const deployedAtMask: Int = 0xffffffff00000000000000000000000000000000000000000000000000000000;
const stageSrcWithdrawal: Int = 0;
const stageSrcPublicWithdrawal: Int = 1;
const stageSrcCancellation: Int = 2;
const stageSrcPublicCancellation: Int = 3;
const stageDstWithdrawal: Int = 4;
const stageDstPublicWithdrawal: Int = 5;
const stageDstCancellation: Int = 6;

const deployedAtOffset: Int = 224;

inline fun setDeployedAt(state: Int, at: Int): Int {
    let cleared: Int = state & (~deployedAtMask);
    let shifted: Int = at << deployedAtOffset;
    return cleared | shifted;
}

inline fun getTimeLockStateValue(state: Int, stage: Int): Int {
    let bitShift: Int = stage * 32;
    // deployed at the stage value
    return (state >> deployedAtOffset) + ((state >> bitShift) & 0xffffffff);
}

struct TimeLockData {
    srcWithdrawal: Int as uint256;
    srcPublicWithdrawal: Int as uint256;
    srcCancellation: Int as uint256;
    srcPublicCancellation: Int as uint256;
    dstWithdrawal: Int as uint256;
    dstPublicWithdrawal: Int as uint256;
    dstCancellation: Int as uint256;
}

inline fun createTimeLockState(data: TimeLockData): Int {
    let init: Int = 0;
    init |= data.srcWithdrawal << ((stageSrcWithdrawal * 32));
    init |= data.srcPublicWithdrawal << ((stageSrcPublicWithdrawal * 32));
    init |= data.srcCancellation << ((stageSrcCancellation * 32));
    init |= data.srcPublicCancellation << ((stageSrcPublicCancellation * 32));
    init |= data.dstWithdrawal << ((stageDstWithdrawal * 32));
    init |= data.dstPublicWithdrawal << ((stageDstPublicWithdrawal * 32));
    init |= data.dstCancellation << ((stageDstCancellation * 32));
    // the deployed at is default set to 0
    return init;
}
