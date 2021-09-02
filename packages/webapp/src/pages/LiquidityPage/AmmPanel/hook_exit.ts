import React from "react";
import {
    AccountStatus,
    AmmExitData,
    AmmInData,
    CoinInfo,
    fnType,
    IBData,
    SagaStatus,
} from '@loopring-web/common-resources';
import { TradeBtnStatus } from '@loopring-web/component-lib';
import { IdMap, useTokenMap } from '../../../stores/token';
import { useAmmMap } from '../../../stores/Amm/AmmMap';
import {
    accountStaticCallBack,
    ammPairInit,
    btnClickMap,
    btnLabel,
    makeCache,
    makeWalletLayer2
} from '../../../hooks/help';
import * as sdk from 'loopring-sdk';
import {
    AmmPoolInfoV3,
    AmmPoolRequestPatch,
    AmmPoolSnapshot,
    ChainId,
    dumpError400,
    ExitAmmPoolRequest,
    getExistedMarket,
    GetNextStorageIdRequest,
    GetOffchainFeeAmtRequest,
    LoopringMap,
    makeExitAmmPoolRequest2,
    OffchainFeeInfo,
    OffchainFeeReqType,
    TickerData,
    TokenInfo,
} from 'loopring-sdk';
import { useAccount } from '../../../stores/account/hook';
import store from "stores";
import { LoopringAPI } from "api_wrapper";
import { deepClone } from '../../../utils/obj_tools';
import { myLog } from "utils/log_tools";
import { useTranslation } from "react-i18next";

import { useWalletLayer2Socket, walletLayer2Service } from 'services/socket';
import { useBtnStatus } from "hooks/common/useBtnStatus";

const initSlippage = 0.5

export const useAmmExit = <C extends { [key: string]: any }>({
    setToastOpen,
    pair,
    ammPoolSnapshot,
    snapShotData,
}
    : {
        ammPoolSnapshot: AmmPoolSnapshot | undefined,
        setToastOpen: any,
        pair: { coinAInfo: CoinInfo<C> | undefined, coinBInfo: CoinInfo<C> | undefined },
        snapShotData: { tickerData: TickerData | undefined, ammPoolSnapshot: AmmPoolSnapshot | undefined } | undefined
    }) => {
    const { t } = useTranslation('common');

    const [isLoading, setIsLoading] = React.useState(false)

    const { idIndex, marketArray, marketMap, coinMap, tokenMap } = useTokenMap();
    const { ammMap } = useAmmMap();
    const { account, status: accountStatus } = useAccount();

    const [baseToken, setBaseToken] = React.useState<TokenInfo>();
    const [quoteToken, setQuoteToken] = React.useState<TokenInfo>();
    const [baseMinAmt, setBaseMinAmt,] = React.useState<any>()
    const [quoteMinAmt, setQuoteMinAmt,] = React.useState<any>()

    const [ammCalcData, setAmmCalcData] = React.useState<AmmInData<C> | undefined>();

    const [ammData, setAmmData] = React.useState<AmmExitData<IBData<string>, string>>({
        coinLP: { belong: undefined } as unknown as IBData<string>,
        slippage: initSlippage
    } as AmmExitData<IBData<string>, string>);

    const [btnI18nKey, setBtnI18nKey] = React.useState<string | undefined>(undefined);

    const [fees, setFees] = React.useState<LoopringMap<OffchainFeeInfo>>()
    const [fee, setFee] = React.useState<number>(0)

    const { account: { accountId, apiKey } } = useAccount()

    const { btnStatus, enableBtn, disableBtn, setLoadingBtn, } = useBtnStatus()

    const [request, setRequest] = React.useState<{ 
        volA_show: number,
        volB_show: number, 
        ammInfo: any, 
        request: ExitAmmPoolRequest }>();

    React.useEffect(() => {
        if (account.readyState !== AccountStatus.ACTIVATED) {
            enableBtn()
            setBtnI18nKey(accountStaticCallBack(btnLabelNew))
        } else {
            setBtnI18nKey(accountStaticCallBack(btnLabelNew, [{ ammData }]))
        }

    }, [account.readyState, ammData])

    const initAmmData = React.useCallback(async (pair: any, walletMap: any) => {

        const _ammCalcData = ammPairInit({
            fee,
            pair,
            _ammCalcData: {},
            coinMap,
            walletMap,
            ammMap,
            tickerData: snapShotData?.tickerData,
            ammPoolSnapshot: snapShotData?.ammPoolSnapshot
        })

        myLog('exit !!! initAmmData:', _ammCalcData)

        setAmmCalcData({ ...ammCalcData, ..._ammCalcData });
        if (_ammCalcData.lpCoin && _ammCalcData.myCoinA && _ammCalcData.myCoinB && tokenMap) {

            const baseT = tokenMap[_ammCalcData.myCoinA.belong]

            const quoteT = tokenMap[_ammCalcData.myCoinB.belong]

            setBaseToken(baseT)
            setQuoteToken(quoteT)

            setBaseMinAmt(baseT ? sdk.toBig(baseT.orderAmounts.minimum).div('1e' + baseT.decimals).toNumber() : undefined)
            setQuoteMinAmt(quoteT ? sdk.toBig(quoteT.orderAmounts.minimum).div('1e' + quoteT.decimals).toNumber() : undefined)

            setAmmData({
                coinLP: _ammCalcData.lpCoin as any,
                slippage: initSlippage,
            })
        }

    }, [fee, snapShotData, coinMap, tokenMap, ammCalcData, ammMap,
        setAmmCalcData, setAmmData, setBaseToken, setQuoteToken, setBaseMinAmt, setQuoteMinAmt, ])

    const btnLabelActiveCheck = React.useCallback(({ ammData, request }): string | undefined => {

        myLog('btnLabelActiveCheck ammData:', ammData)
        myLog('btnLabelActiveCheck req:', request)

        const times = 1

        const validAmt1 = request?.volA_show ? request?.volA_show >= times * baseMinAmt : false
        const validAmt2 = request?.volB_show ? request?.volB_show >= times * quoteMinAmt : false

        if (isLoading) {
            setBtnI18nKey(TradeBtnStatus.LOADING)
            return undefined
        } else {
            if (account.readyState === AccountStatus.ACTIVATED) {
                if (ammData === undefined
                    || ammData?.coinLP?.tradeValue === undefined
                    || ammData?.coinLP?.tradeValue === 0) {
                    disableBtn()
                    return 'labelEnterAmount';
                } else if (validAmt1 && validAmt2) {
                    enableBtn()
                    return undefined
                } else {
                    disableBtn()
                    return `labelLimitMin, ${times * baseMinAmt} ${baseToken?.symbol} / ${times * quoteMinAmt} ${quoteToken?.symbol}`
                }

            } else {
                enableBtn()
            }

        }

        return undefined

    }, [account.readyState, baseToken, quoteToken, baseMinAmt, quoteMinAmt, isLoading, enableBtn, disableBtn,])

    const btnLabelNew = Object.assign(deepClone(btnLabel), {
        [fnType.ACTIVATED]: [btnLabelActiveCheck]
    });

    const calculateCallback = React.useCallback(async () => {
        if (accountStatus === SagaStatus.UNSET) {
            if (!LoopringAPI.userAPI || !pair.coinBInfo?.simpleName
                || account.readyState !== AccountStatus.ACTIVATED
                || !ammCalcData || !tokenMap) {
                return
            }
            const feeToken: TokenInfo = tokenMap[pair.coinBInfo.simpleName]

            const requestType = OffchainFeeReqType.AMM_EXIT

            const request: GetOffchainFeeAmtRequest = {
                accountId,
                requestType,
                tokenSymbol: pair.coinBInfo.simpleName as string,
            }

            const { fees } = await LoopringAPI.userAPI.getOffchainFeeAmt(request, apiKey)

            setFees(fees)

            const feeRaw = fees[pair.coinBInfo.simpleName] ? fees[pair.coinBInfo.simpleName].fee : 0
            const fee = sdk.toBig(feeRaw).div('1e' + feeToken.decimals)

            setFee(fee.toNumber())

            setAmmCalcData({
                ...ammCalcData, fee: fee.toString()
                    + ' ' + pair.coinBInfo.simpleName,
            })
        }

    }, [
        setFees, setAmmCalcData, setBtnI18nKey,
        accountStatus, account.readyState, accountId, apiKey,
        pair.coinBInfo?.simpleName, tokenMap, ammCalcData
    ])

    React.useEffect(() => {
        calculateCallback()
    }, [accountStatus, account.readyState, pair, request])

    const handleExit = React.useCallback(async ({ data, requestOut, ammData, fees, ammPoolSnapshot, tokenMap, account }) => {

        myLog('handle exit:', requestOut)

        setBtnI18nKey(accountStaticCallBack(btnLabelNew, [{ ammData, request: requestOut, }]))

        myLog('exit data:', data, ammData)

        if (!tokenMap || !baseToken || !quoteToken
            || !ammPoolSnapshot || !account?.accAddress) {
            return
        }

        const { slippage } = data

        const slippageReal = sdk.toBig(slippage).div(100).toString()

        const { ammMap } = store.getState().amm.ammMap

        const { market, amm } = getExistedMarket(marketArray, baseToken.symbol, quoteToken.symbol)

        if (!market || !amm || !marketMap) {
            debugger
            return
        }

        const ammInfo: AmmPoolInfoV3 = ammMap[amm as string]

        const rawVal = data.coinLP.tradeValue

        const { volA_show, volB_show ,request } = makeExitAmmPoolRequest2(rawVal.toString(), slippageReal, account.accAddress, fees as LoopringMap<OffchainFeeInfo>,
            ammMap[amm], ammPoolSnapshot, tokenMap as any, idIndex as IdMap, 0)

        // setAmmCalcData()

        myLog('exit req:', request)

        const req = {
            volA_show,
            volB_show,
            ammInfo,
            request,
        }

        setBtnI18nKey(accountStaticCallBack(btnLabelNew, [{ ammData: data, request: req, }]))

        setRequest(req)

    }, [setRequest, idIndex, marketArray, marketMap, baseToken, quoteToken])

    const handleAmmPoolEvent = (data: AmmExitData<IBData<any>>, _type: 'coinA' | 'coinB') => {
        myLog('handleAmmPoolEvent request:', request)
        handleExit({ data, requestOut: request, ammData, type: _type, fees, ammPoolSnapshot, tokenMap, account })
    }

    const ammCalculator = React.useCallback(async function (props) {

        setIsLoading(true)
        setLoadingBtn()

        if (!LoopringAPI.ammpoolAPI || !LoopringAPI.userAPI || !request || !account?.eddsaKey?.sk) {
            myLog(' onAmmJoin ammpoolAPI:', LoopringAPI.ammpoolAPI,
                'joinRequest:', request)

            setToastOpen({ open: true, type: 'success', content: t('labelJoinAmmFailed') })
            setIsLoading(false)
            walletLayer2Service.sendUserUpdate()
            return
        }

        const { ammInfo, request: reqTmp } = request

        const patch: AmmPoolRequestPatch = {
            chainId: store.getState().system.chainId as ChainId,
            ammName: ammInfo.__rawConfig__.name,
            poolAddress: ammInfo.address,
            eddsaKey: account.eddsaKey.sk
        }

        const reqExit: ExitAmmPoolRequest = reqTmp as ExitAmmPoolRequest

        const burnedReq: GetNextStorageIdRequest = {
            accountId: account.accountId,
            sellTokenId: reqExit.exitTokens.burned.tokenId as number
        }
        const storageId0 = await LoopringAPI.userAPI.getNextStorageId(burnedReq, account.apiKey)

        myLog('---- try to exit storageId0:', storageId0)

        reqExit.storageId = storageId0.offchainId

        try {

            myLog('---- try to exit req:', reqExit)
            setAmmData({
                ...ammData, ...{
                    coinLP: { ...ammData.coinLP, tradeValue: 0 },
                }
            })
            const response = await LoopringAPI.ammpoolAPI.exitAmmPool(reqExit, patch, account.apiKey)

            myLog('exit ammpool response:', response)

            if ((response.exitAmmPoolResult as any)?.resultInfo) {
                setToastOpen({ open: true, type: 'error', content: t('labelExitAmmFailed') })
            } else {
                setToastOpen({ open: true, type: 'success', content: t('labelExitAmmSuccess') })
            }

        } catch (reason) {
            dumpError400(reason)
            setToastOpen({ open: true, type: 'error', content: t('labelExitAmmFailed') })
        } finally {
            setIsLoading(false)
            walletLayer2Service.sendUserUpdate()
        }

        if (props.__cache__) {
            makeCache(props.__cache__)
        }

    }, [request, ammData, account, t, setLoadingBtn,])

    const onAmmClickMap = Object.assign(deepClone(btnClickMap), {
        [fnType.ACTIVATED]: [ammCalculator]
    })
    const onAmmClick = React.useCallback((props: AmmExitData<IBData<any>>) => {
        accountStaticCallBack(onAmmClickMap, [props])
    }, [onAmmClickMap]);

    const walletLayer2Callback = React.useCallback(() => {

        if (pair?.coinAInfo?.simpleName && snapShotData?.ammPoolSnapshot) {
            const { walletMap } = makeWalletLayer2()
            initAmmData(pair, walletMap)
            setIsLoading(false)
        }

    }, [fee, pair?.coinAInfo?.simpleName, snapShotData?.tickerData, snapShotData?.ammPoolSnapshot])

    useWalletLayer2Socket({ walletLayer2Callback })

    React.useEffect(() => {
        walletLayer2Callback()
    }, [fee, pair?.coinAInfo?.simpleName, snapShotData?.tickerData, snapShotData?.ammPoolSnapshot, tokenMap])

    return {
        ammCalcData,
        ammData,
        handleAmmPoolEvent,
        btnStatus,
        onAmmClick,
        btnI18nKey,

    }
}