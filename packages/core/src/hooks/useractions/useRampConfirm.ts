import {
  AccountStatus,
  AddressError,
  CoinMap,
  FeeInfo,
  IBData,
  myLog,
  UIERROR_CODE,
  WALLET_TYPE,
  WalletMap,
} from "@loopring-web/common-resources";
import { useAccount, useModalData, useSystem, useTokenMap } from "../../stores";
import { AccountStep, useOpenModals } from "@loopring-web/component-lib";
import React from "react";
import { makeWalletLayer2 } from "../help";
import { useWalletLayer2Socket } from "../../services";
import { useBtnStatus } from "../common";
import * as sdk from "@loopring-web/loopring-sdk";
import { LoopringAPI } from "../../api_wrapper";
import { connectProvides } from "@loopring-web/web3-provider";
import { getTimestampDaysLater } from "../../utils";
import { DAYS } from "../../defs";
import { RAMP_SELL_PANEL, useRampTransPost } from "./useVendor";

export const useRampConfirm = <T extends IBData<I>, I, _C extends FeeInfo>({
  sellPanel,
  setSellPanel,
}: {
  sellPanel: RAMP_SELL_PANEL;
  setSellPanel: (value: RAMP_SELL_PANEL) => void;
}) => {
  const { exchangeInfo } = useSystem();

  const {
    allowTrade: { raw_data },
  } = useSystem();
  const legalEnable = (raw_data as any)?.legal?.enable;
  const { tokenMap, totalCoinMap } = useTokenMap();
  const {
    setShowAccount,
    modals: {
      isShowAccount: { info },
    },
  } = useOpenModals();
  const { account } = useAccount();
  const [balanceNotEnough, setBalanceNotEnough] = React.useState(false);
  const { offRampValue } = useModalData();
  const {
    processRequestRampTransfer: processRequest,
    chargeFeeTokenList,
    isFeeNotEnough,
    handleFeeChange,
    feeInfo,
    checkFeeIsEnough,
  } = useRampTransPost();
  const [walletMap, setWalletMap] = React.useState(
    makeWalletLayer2(true).walletMap ?? ({} as WalletMap<T>)
  );
  const walletLayer2Callback = React.useCallback(() => {
    const walletMap = makeWalletLayer2(true).walletMap ?? {};
    setWalletMap(walletMap);
  }, []);

  useWalletLayer2Socket({ walletLayer2Callback });

  const { btnStatus, enableBtn, disableBtn } = useBtnStatus();
  const { transferRampValue, updateTransferRampData, resetOffRampData } =
    useModalData();

  React.useEffect(() => {
    if (
      info?.transferRamp === AccountStep.Transfer_RAMP_Failed &&
      info?.trigger == "checkFeeIsEnough"
    ) {
      checkFeeIsEnough();
    }
  }, [info?.transferRamp]);

  const checkBtnStatus = React.useCallback(() => {
    if (
      tokenMap &&
      chargeFeeTokenList.length &&
      !isFeeNotEnough.isFeeNotEnough &&
      transferRampValue.belong &&
      tokenMap[transferRampValue.belong] &&
      transferRampValue.fee &&
      transferRampValue.fee.belong &&
      transferRampValue.address
    ) {
      const sellToken = tokenMap[transferRampValue.belong];
      const feeToken = tokenMap[transferRampValue.fee.belong];
      const feeRaw =
        transferRampValue.fee.feeRaw ??
        transferRampValue.fee.__raw__?.feeRaw ??
        0;
      const fee = sdk.toBig(feeRaw);
      const balance = sdk
        .toBig(transferRampValue.balance ?? 0)
        .times("1e" + sellToken.decimals);
      const tradeValue = sdk
        .toBig(transferRampValue.tradeValue ?? 0)
        .times("1e" + sellToken.decimals);
      const isExceedBalance = tradeValue
        .plus(feeToken.tokenId === sellToken.tokenId ? fee : "0")
        .gt(balance);
      myLog(
        "isExceedBalance",
        isExceedBalance,
        fee.toString(),
        tradeValue.toString()
      );
      if (tradeValue && !isExceedBalance) {
        enableBtn();
        return;
      } else {
        disableBtn();
        // if (isExceedBalance && feeToken.tokenId === sellToken.tokenId) {
        //   // setIsFeeEnough(isFeeNotEnoughtrue);
        //   // setIsFeeNotEnough({
        //   //   isFeeNotEnough: true,
        //   //   isOnLoading: false,
        //   // });
        //   setBalanceNotEnough(true);
        // } else
        if (isExceedBalance) {
          setBalanceNotEnough(true);
        }
        // else {
        //
        // }
      }
    }
    disableBtn();
  }, [
    chargeFeeTokenList.length,
    disableBtn,
    enableBtn,
    isFeeNotEnough.isFeeNotEnough,
    tokenMap,
    transferRampValue.address,
    transferRampValue.balance,
    transferRampValue.belong,
    transferRampValue.fee,
    transferRampValue.tradeValue,
  ]);

  React.useEffect(() => {
    checkBtnStatus();
  }, [chargeFeeTokenList, isFeeNotEnough.isFeeNotEnough, transferRampValue]);

  const onTransferClick = React.useCallback(
    async (transferRampValue, isFirstTime: boolean = true) => {
      const { accountId, accAddress, readyState, apiKey, eddsaKey } = account;

      if (
        readyState === AccountStatus.ACTIVATED &&
        tokenMap &&
        LoopringAPI.userAPI &&
        exchangeInfo &&
        connectProvides.usedWeb3 &&
        transferRampValue.address !== "*" &&
        transferRampValue?.fee &&
        transferRampValue?.fee.belong &&
        transferRampValue.fee?.__raw__ &&
        eddsaKey?.sk
      ) {
        try {
          setShowAccount({
            isShow: true,
            step: AccountStep.Transfer_RAMP_WaitForAuth,
          });

          const sellToken = tokenMap[transferRampValue.belong as string];
          const feeToken = tokenMap[transferRampValue.fee.belong];
          const feeRaw =
            transferRampValue.fee.feeRaw ??
            transferRampValue.fee.__raw__?.feeRaw ??
            0;
          const fee = sdk.toBig(feeRaw);
          // const balance = sdk
          //   .toBig(transferRampValue.balance ?? 0)
          //   .times("1e" + sellToken.decimals);
          const tradeValue = sdk
            .toBig(transferRampValue.tradeValue ?? 0)
            .times("1e" + sellToken.decimals);
          // const isExceedBalance =
          //   feeToken.tokenId === sellToken.tokenId &&
          //   tradeValue.plus(fee).gt(balance);
          const finalVol = tradeValue;
          const transferVol = finalVol.toFixed(0, 0);

          const storageId = await LoopringAPI.userAPI?.getNextStorageId(
            {
              accountId,
              sellTokenId: sellToken.tokenId,
            },
            apiKey
          );
          const req: sdk.OriginTransferRequestV3 = {
            exchange: exchangeInfo.exchangeAddress,
            payerAddr: accAddress,
            payerId: accountId,
            payeeAddr: transferRampValue.address,
            payeeId: 0,
            storageId: storageId?.offchainId,
            token: {
              tokenId: sellToken.tokenId,
              volume: transferVol,
            },
            maxFee: {
              tokenId: feeToken.tokenId,
              volume: fee.toString(), // TEST: fee.toString(),
            },
            validUntil: getTimestampDaysLater(DAYS),
            memo: transferRampValue.memo,
          };

          myLog("transfer req:", req);

          processRequest(req, isFirstTime);
        } catch (e: any) {
          // transfer failed
          setShowAccount({
            isShow: true,
            step: AccountStep.Transfer_RAMP_Failed,
            error: {
              code: UIERROR_CODE.UNKNOWN,
              message: e.message,
            } as sdk.RESULT_INFO,
          });
        }
      } else {
        return;
      }
    },
    [account, tokenMap, exchangeInfo, setShowAccount, processRequest]
  );

  // const [rampViewProps, setRampViewProps] =
  //   React.useState<RampViewProps<T, I, C> | undefined>(undefined);

  const initRampViewProps = React.useCallback(() => {
    if (offRampValue?.send && window.rampInstance) {
      const { amount, assetSymbol, destinationAddress } = offRampValue?.send;

      const memo = "OFF-RAMP Transfer";
      updateTransferRampData({
        belong: assetSymbol,
        tradeValue: Number(amount),
        balance: walletMap[assetSymbol]?.count,
        fee: feeInfo,
        memo,
        address: destinationAddress as string,
      });
      return;
    }
    if (window.rampInstance) {
      window.rampInstance.close();
    } else {
      setSellPanel(RAMP_SELL_PANEL.LIST);
      resetOffRampData();
    }
  }, [
    btnStatus,
    chargeFeeTokenList,
    feeInfo,
    handleFeeChange,
    isFeeNotEnough,
    legalEnable,
    onTransferClick,
    setSellPanel,
    totalCoinMap,
    updateTransferRampData,
  ]);
  React.useEffect(() => {
    if (RAMP_SELL_PANEL.RAMP_CONFIRM) {
      initRampViewProps();
    } else {
      //TODO MOCK
      // resetTransferRampData();
    }
  }, [sellPanel, walletMap]);

  const rampViewProps = React.useMemo(() => {
    const { address, memo, fee, __request__, ...tradeData } = transferRampValue;
    return {
      type: "TOKEN",
      disabled: !legalEnable,
      addressDefault: address,
      realAddr: address,
      tradeData,
      coinMap: totalCoinMap as CoinMap<T>,
      transferBtnStatus: btnStatus,
      isLoopringAddress: true,
      isSameAddress: false,
      isAddressCheckLoading: WALLET_TYPE.Loopring,
      feeInfo,
      handleFeeChange,
      balanceNotEnough,
      chargeFeeTokenList,
      isFeeNotEnough,
      handleSureItsLayer2: () => undefined,
      sureItsLayer2: true,
      onTransferClick,
      handlePanelEvent: () => undefined,
      addrStatus: AddressError.NoError,
      memo,
      walletMap,
      handleOnMemoChange: () => undefined,
      handleOnAddressChange: () => undefined,
    } as any;
  }, [
    balanceNotEnough,
    btnStatus,
    chargeFeeTokenList,
    feeInfo,
    handleFeeChange,
    isFeeNotEnough,
    legalEnable,
    onTransferClick,
    totalCoinMap,
    transferRampValue,
    walletMap,
  ]);

  return { rampViewProps };
};
