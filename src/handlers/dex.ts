import { SubstrateExtrinsic } from '@subql/types'
import { insertDataToEntity, getCommonExtrinsicData, findEvent } from '../helpers'
import { AddLiquidityHistoryEntity } from '../types/models/AddLiquidityHistoryEntity'
import { RemoveLiquidityHistoryEntity } from '../types/models/RemoveLiquidityHistoryEntity'
import { SwapHistoryEntity } from '../types/models/SwapHistoryEntity'
import { ExtrinsicHandler, ExtrinsicData, CallData } from './types'

export const addLiquidityHandler: ExtrinsicHandler = async (call, extrinsic) => {
    const { extrinsic: _extrinsic, events } = extrinsic
    const signer = _extrinsic.signer.toString()
    const [token1, token2, token1MaxAmount ,token2MaxAmount] = call.args
    const commonExtrinsicData = getCommonExtrinsicData(call, extrinsic)
    const record = new AddLiquidityHistoryEntity(commonExtrinsicData.hash)

    insertDataToEntity(record, commonExtrinsicData)

    record.account = signer
    record.token1 = token1.toString()
    record.token2 = token2.toString()
    record.token1MaxAmount = token1MaxAmount.toString()
    record.token2MaxMaount = token2MaxAmount.toString()

    const addLiquidityEvent = findEvent(events, 'dex', 'AddLiquidity')

    if (addLiquidityEvent) {
        const data = addLiquidityEvent.event.data
        const [_account, token1, token1Amount, _token2, token2Amount, share] = data
        
        // put the position of the amount right according to the event 
        if (token1.toString() === record.token1) {
            record.token1Amount = token1Amount.toString()
            record.token2Amount = token2Amount.toString()
        } else if (token1.toString() === record.token2){
            record.token1Amount = token2Amount.toString()
            record.token2Amount = token1Amount.toString()
        }

        record.receivedShare = share.toString()
    }

    await record.save()
}

export const removeLiquidityHandler: ExtrinsicHandler = async (call, extrinsic) => {
    const { extrinsic: _extrinsic, events } = extrinsic
    const signer = _extrinsic.signer.toString()
    const [token1, token2, removedShare] = call.args
    const commonExtrinsicData = getCommonExtrinsicData(call, extrinsic)

    const record = new RemoveLiquidityHistoryEntity(commonExtrinsicData.hash)

    insertDataToEntity(record, commonExtrinsicData)

    record.account = signer
    record.token1 = token1.toString()
    record.token2 = token2.toString()
    record.removedShare = removedShare.toString()

    const removeLiquidityEvent = findEvent(events, 'dex', 'RemoveLiquidity')

    if (removeLiquidityEvent) {
        const data = removeLiquidityEvent.event.data
        const [_account, token1, token1Amount, _token2, token2Amount, removedShare] = data
        
        // put the position of the amount right according to the event 
        if (token1.toString() === record.token1) {
            record.token1Amount = token1Amount.toString()
            record.token2Amount = token2Amount.toString()
        } else if (token1.toString() === record.token2){
            record.token1Amount = token2Amount.toString()
            record.token2Amount = token1Amount.toString()
        }

        record.removedShare = removedShare.toString()
    }

    await record.save()
}

const baseSwapHandler = async (
    call: CallData,
    extrinsic: ExtrinsicData,
    type: 'swapWithExactSupply' | 'swapWithExactTarget'
) => {
    const { extrinsic: _extrinsic, events } = extrinsic
    const signer = _extrinsic.signer.toString()
    const [path, params1, params2] =  call.args
    const commonExtrinsicData = getCommonExtrinsicData(call, extrinsic)
    const record = new SwapHistoryEntity(commonExtrinsicData.hash)

    insertDataToEntity(record, commonExtrinsicData)

    record.account = signer.toString()
    record.type = type
    record.path = JSON.stringify(path.toJSON())
    record.params1 = params1.toString()
    record.params2 = params2.toString()

    const swapEvent = findEvent(events, 'dex', 'Swap')

    if (swapEvent) {
        record.supplyAmount = swapEvent.event.data[2].toString()
        record.targetAmount = swapEvent.event.data[3].toString()
    }

    await record.save()
}

export const swapWithExactSupplyHandler: ExtrinsicHandler = async (call, extrinsic) => {
    await baseSwapHandler(call, extrinsic, 'swapWithExactSupply')
}

export const swapWithExactTargetHandler: ExtrinsicHandler = async (call, extrinsic) => {
    await baseSwapHandler(call, extrinsic, 'swapWithExactTarget')
}