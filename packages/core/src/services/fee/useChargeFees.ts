import * as sdk from "@loopring-web/loopring-sdk";
import { useSettings } from "@loopring-web/component-lib";

import React from "react";
import * as _ from "lodash";
import {
  AccountStatus,
  FeeChargeOrderDefault,
  FeeChargeOrderUATDefault,
  FeeInfo,
  globalSetup,
  WalletMap,
} from "@loopring-web/common-resources";
import {
  useTokenMap,
  LoopringAPI,
  useAccount,
  useSystem,
  makeWalletLayer2,
  store,
  useWalletLayer2,
} from "../../index";

const INTERVAL_TIME = (() => 900000)();
export function useChargeFees({
  tokenSymbol,
  requestType,
  amount,
  tokenAddress,
  updateData,
  needAmountRefresh,
  isActiveAccount = false,
  deployInWithdraw = undefined,
  intervalTime = INTERVAL_TIME,
}: {
  tokenAddress?: string | undefined;
  tokenSymbol?: string | undefined;
  requestType: sdk.OffchainFeeReqType | sdk.OffchainNFTFeeReqType;
  amount?: number;
  intervalTime?: number;
  updateData?:
    | undefined
    | ((props: {
        fee: FeeInfo;
        chargeFeeTokenList?: FeeInfo[];
        isFeeNotEnough?: {
          isFeeNotEnough: boolean;
          isOnLoading: boolean;
        };
        [key: string]: any;
      }) => void);
  isActiveAccount?: boolean;
  needAmountRefresh?: boolean;
  deployInWithdraw?: boolean;
}): {
  chargeFeeTokenList: FeeInfo[];
  isFeeNotEnough: {
    isFeeNotEnough: boolean;
    isOnLoading: boolean;
  };
  checkFeeIsEnough: (
    props?: {
      isRequiredAPI: true;
      intervalTime?: number;
    } & any
  ) => void;
  handleFeeChange: (value: FeeInfo) => void;
  feeInfo: FeeInfo;
  resetIntervalTime: () => void;
} {
  const [feeInfo, setFeeInfo] = React.useState<FeeInfo>({
    belong: "ETH",
    fee: 0,
    feeRaw: undefined,
  } as FeeInfo);
  const { chainId } = useSystem();
  let { feeChargeOrder } = useSettings();
  feeChargeOrder =
    chainId === sdk.ChainId.MAINNET
      ? FeeChargeOrderDefault
      : FeeChargeOrderUATDefault;
  const nodeTimer = React.useRef<NodeJS.Timeout | -1>(-1);
  const [chargeFeeTokenList, setChargeFeeTokenList] = React.useState<FeeInfo[]>(
    []
  );
  const [isFeeNotEnough, setIsFeeNotEnough] = React.useState<{
    isFeeNotEnough: boolean;
    isOnLoading: boolean;
  }>({
    isFeeNotEnough: false,
    isOnLoading: false,
  });
  const { tokenMap } = useTokenMap();
  const { account } = useAccount();
  const [_amount, setAmount] = React.useState({ amount, needAmountRefresh });
  const [_intervalTime, setIntervalTime] = React.useState<number>(intervalTime);
  const { status: walletLayer2Status } = useWalletLayer2();
  const handleFeeChange = (_value: FeeInfo): void => {
    const walletMap =
      makeWalletLayer2(true).walletMap ?? ({} as WalletMap<any>);
    let isFeeNotEnough = {
      isFeeNotEnough: true,
      isOnLoading: false,
    };
    const value =
      chargeFeeTokenList.find((ele) => _value?.belong === ele.belong) ?? _value;
    if (
      walletMap &&
      value?.belong &&
      walletMap[value.belong] &&
      walletMap[value.belong]?.count &&
      sdk
        // @ts-ignore
        .toBig(walletMap[value.belong].count)
        .gte(sdk.toBig(value.fee.toString().replace(sdk.SEP, "")))
    ) {
      isFeeNotEnough = {
        isFeeNotEnough: false,
        isOnLoading: false,
      };
      setIsFeeNotEnough(isFeeNotEnough);
    } else {
      setIsFeeNotEnough(isFeeNotEnough);
    }
    if (updateData && value) {
      updateData({
        fee: {
          ...value,
          __raw__: {
            ...value.__raw__,
            tokenId: tokenMap[value.belong.toString()].tokenId,
          },
        },
        isFeeNotEnough: isFeeNotEnough,
        amount: _amount.needAmountRefresh ? _amount.amount : undefined,
      });
    }
    setFeeInfo(value);
  };

  const getFeeList = _.debounce(
    async () => {
      let isFeeNotEnough = {
        isFeeNotEnough: true,
        isOnLoading: false,
      };
      let _feeInfo: any = undefined,
        isSame = true;
      let tokenInfo;
      setIsFeeNotEnough((state) => {
        isFeeNotEnough = { ...state };
        return { ...state, isOnLoading: true };
      });
      const { tokenMap } = store.getState().tokenMap;
      const walletMap =
        makeWalletLayer2(true).walletMap ?? ({} as WalletMap<any>);
      if (nodeTimer.current !== -1) {
        clearTimeout(nodeTimer.current as NodeJS.Timeout);
      }

      if (tokenSymbol && tokenMap) {
        tokenInfo = tokenMap[tokenSymbol];
      }
      if (
        tokenMap &&
        tokenMap.ETH &&
        LoopringAPI.userAPI &&
        LoopringAPI.globalAPI
      ) {
        try {
          const request:
            | sdk.GetOffchainFeeAmtRequest
            | sdk.GetNFTOffchainFeeAmtRequest = {
            accountId: account.accountId,
            tokenSymbol,
            tokenAddress,
            requestType,
            amount:
              tokenInfo && _amount.amount && _amount.needAmountRefresh
                ? sdk
                    .toBig(_amount.amount)
                    .times("1e" + tokenInfo.decimals)
                    .toFixed(0, 0)
                : "0",
            deployInWithdraw:
              requestType === sdk.OffchainNFTFeeReqType.NFT_WITHDRAWAL
                ? deployInWithdraw
                : undefined,
          };
          let fees: any;
          if (isActiveAccount) {
            const response = await LoopringAPI.globalAPI.getActiveFeeInfo({
              accountId:
                account.accountId && account.accountId !== -1
                  ? account.accountId
                  : account._accountIdNotActive &&
                    account._accountIdNotActive !== -1
                  ? account._accountIdNotActive
                  : undefined,
            });

            if (
              (response as sdk.RESULT_INFO).code ||
              (response as sdk.RESULT_INFO).message
            ) {
            } else {
              fees = response.fees;
            }
          } else if (
            [
              sdk.OffchainNFTFeeReqType.NFT_MINT,
              sdk.OffchainNFTFeeReqType.NFT_WITHDRAWAL,
              sdk.OffchainNFTFeeReqType.NFT_TRANSFER,
              sdk.OffchainNFTFeeReqType.NFT_DEPLOY,
            ].includes(requestType as any) &&
            account.accountId &&
            account.accountId !== -1 &&
            account.apiKey
          ) {
            const response = await LoopringAPI.userAPI.getNFTOffchainFeeAmt(
              request as sdk.GetNFTOffchainFeeAmtRequest,
              account.apiKey
            );
            if (
              (response as sdk.RESULT_INFO).code ||
              (response as sdk.RESULT_INFO).message
            ) {
            } else {
              fees = response.fees;
            }
          } else if (
            account.accountId &&
            account.accountId !== -1 &&
            account.apiKey
          ) {
            const response = await LoopringAPI.userAPI.getOffchainFeeAmt(
              request as sdk.GetOffchainFeeAmtRequest,
              account.apiKey
            );
            if (
              (response as sdk.RESULT_INFO).code ||
              (response as sdk.RESULT_INFO).message
            ) {
            } else {
              fees = response.fees;
            }
          }

          if (_amount?.needAmountRefresh) {
            setAmount((state) => {
              isSame = _amount.amount === state.amount;
              return state;
            });
          }
          if (isSame && fees && feeChargeOrder) {
            const _chargeFeeTokenList = feeChargeOrder?.reduce((pre, item) => {
              let { fee, token } = fees[item] ?? {};
              if (fee && token) {
                const tokenInfo = tokenMap[token];
                const tokenId = tokenInfo.tokenId;
                const fastWithDraw = tokenInfo.fastWithdrawLimit;
                const feeRaw = fee;
                fee = sdk
                  .toBig(fee)
                  .div("1e" + tokenInfo.decimals)
                  .toString();
                const feeInfoTemplate = {
                  belong: token,
                  fee,
                  feeRaw,
                  hasToken: !!(walletMap && walletMap[token]),
                  __raw__: { fastWithDraw, feeRaw, tokenId },
                };
                pre.push(feeInfoTemplate);
                if (_feeInfo === undefined && walletMap && walletMap[token]) {
                  const { count } = walletMap[token] ?? { count: 0 };
                  if (
                    sdk
                      .toBig(count)
                      .gte(sdk.toBig(fee.toString().replace(sdk.SEP, "")))
                  ) {
                    _feeInfo = _.cloneDeep(feeInfoTemplate);
                  }
                }
              }
              return pre;
            }, [] as Array<FeeInfo>);
            let _isFeeNotEnough = {
              isFeeNotEnough: true,
              isOnLoading: false,
            };
            setFeeInfo((state) => {
              if (_feeInfo === undefined) {
                setIsFeeNotEnough(_isFeeNotEnough);
                if (!state || state?.feeRaw === undefined) {
                  _feeInfo = _chargeFeeTokenList[0]
                    ? _.cloneDeep(_chargeFeeTokenList[0])
                    : {
                        belong: "ETH",
                        fee: 0,
                        feeRaw: undefined,
                      };
                  if (updateData && _feeInfo) {
                    updateData({
                      fee: {
                        ..._feeInfo,
                        __raw__: {
                          ..._feeInfo.__raw__,
                          tokenId:
                            tokenMap[_feeInfo?.belong.toString()].tokenId,
                        },
                      },
                      chargeFeeTokenList: _chargeFeeTokenList,
                      isFeeNotEnough: _isFeeNotEnough,
                      amount: _amount.needAmountRefresh
                        ? _amount.amount
                        : undefined,
                    });
                  }
                  return _feeInfo;
                } else {
                  return state;
                }
              } else {
                if (
                  isFeeNotEnough.isFeeNotEnough ||
                  !state ||
                  state?.feeRaw === undefined
                ) {
                  _isFeeNotEnough = {
                    isFeeNotEnough: false,
                    isOnLoading: false,
                  };
                  setIsFeeNotEnough(_isFeeNotEnough);
                  if (updateData && _feeInfo) {
                    updateData({
                      fee: {
                        ..._feeInfo,
                        __raw__: {
                          ...feeInfo?.__raw__,
                          ..._feeInfo?.__raw__,
                          tokenId:
                            tokenMap[_feeInfo?.belong.toString()].tokenId,
                        },
                      },
                      chargeFeeTokenList: _chargeFeeTokenList,
                      isFeeNotEnough: _isFeeNotEnough,
                      amount: _amount.needAmountRefresh
                        ? _amount.amount
                        : undefined,
                    });
                  }
                  return _feeInfo;
                } else {
                  const feeInfo = _chargeFeeTokenList?.find(
                    (ele) => ele.belong === state.belong
                  );
                  if (updateData && feeInfo) {
                    _isFeeNotEnough = {
                      isFeeNotEnough: sdk
                        .toBig(walletMap[state.belong]?.count ?? 0)
                        .lt(
                          sdk.toBig(feeInfo.fee.toString().replace(sdk.SEP, ""))
                        ),
                      isOnLoading: false,
                    };
                    setIsFeeNotEnough(_isFeeNotEnough);
                    updateData({
                      fee: { ...feeInfo },
                      chargeFeeTokenList: _chargeFeeTokenList,
                      isFeeNotEnough: _isFeeNotEnough,
                      amount: _amount.needAmountRefresh
                        ? _amount.amount
                        : undefined,
                    });
                  }
                  return feeInfo ?? state;
                }
              }
            });
            setChargeFeeTokenList(_chargeFeeTokenList ?? []);
          }
        } catch (reason: any) {
          // myLog("chargeFeeTokenList, error", reason);
          if ((reason as sdk.RESULT_INFO).code) {
          }
        }
        if (isSame) {
          nodeTimer.current = setTimeout(() => {
            getFeeList();
          }, _intervalTime);
        }
        return;
      } else {
        nodeTimer.current = setTimeout(() => {
          getFeeList();
        }, 1000);
      }
    },
    globalSetup.wait,
    { trailing: true }
  );

  const checkFeeIsEnough = async (
    props: undefined | ({ isRequiredAPI: true; intervalTime?: number } & any)
  ) => {
    if (props?.isRequiredAPI) {
      const intervalTime = props.intervalTime;
      setIntervalTime((state) => {
        return intervalTime ? intervalTime : state;
      });
      if (props.amount && props.needAmountRefresh) {
        setAmount(() => ({
          amount: props.amount,
          needAmountRefresh: props.needAmountRefresh,
        }));
        getFeeList.cancel();
      } else {
        getFeeList.cancel();
        getFeeList();
      }
    } else {
      const walletMap =
        makeWalletLayer2(true).walletMap ?? ({} as WalletMap<any>);
      if (chargeFeeTokenList && walletMap) {
        chargeFeeTokenList.map((feeInfo) => {
          return {
            ...feeInfo,
            hasToken: !!(walletMap && walletMap[feeInfo.belong]),
          };
        });
      }

      if (feeInfo && feeInfo.belong && feeInfo.feeRaw) {
        const { count } = walletMap[feeInfo.belong] ?? { count: 0 };
        if (
          sdk
            .toBig(count)
            .gte(sdk.toBig(feeInfo.fee.toString().replace(sdk.SEP, "")))
        ) {
          setIsFeeNotEnough({ isFeeNotEnough: false, isOnLoading: false });
          return;
        }
      }
      setIsFeeNotEnough({ isFeeNotEnough: true, isOnLoading: false });
    }
  };

  // React.useEffect(() => {
  //   if (needAmountRefresh) {
  //     setAmount(amount);
  //   }
  // }, [amount]);React.useEffect(() => {
  //   if (needAmountRefresh) {
  //     setAmount(amount);
  //   }
  // }, [amount]);

  React.useEffect(() => {
    if (nodeTimer.current !== -1) {
      clearTimeout(nodeTimer.current as NodeJS.Timeout);
      getFeeList.cancel();
    }
    // myLog('tokenAddress', tokenAddress, requestType, account.readyState)
    if (
      (isActiveAccount &&
        [
          AccountStatus.NO_ACCOUNT,
          AccountStatus.DEPOSITING,
          AccountStatus.NOT_ACTIVE,
          AccountStatus.LOCKED,
        ].includes(account.readyState as any)) ||
      (!isActiveAccount &&
        walletLayer2Status === "UNSET" &&
        AccountStatus.ACTIVATED === account.readyState &&
        [
          sdk.OffchainFeeReqType.UPDATE_ACCOUNT,
          sdk.OffchainFeeReqType.UPDATE_ACCOUNT,
          sdk.OffchainFeeReqType.TRANSFER,
          sdk.OffchainFeeReqType.FORCE_WITHDRAWAL,
          sdk.OffchainNFTFeeReqType.NFT_TRANSFER,
          sdk.OffchainNFTFeeReqType.NFT_DEPLOY,
        ].includes(Number(requestType))) ||
      (!isActiveAccount &&
        walletLayer2Status === "UNSET" &&
        sdk.OffchainNFTFeeReqType.NFT_WITHDRAWAL === requestType &&
        tokenAddress) ||
      (!isActiveAccount &&
        tokenSymbol &&
        AccountStatus.ACTIVATED === account.readyState &&
        walletLayer2Status === "UNSET" &&
        [
          sdk.OffchainFeeReqType.OFFCHAIN_WITHDRAWAL,
          sdk.OffchainFeeReqType.FAST_OFFCHAIN_WITHDRAWAL,
        ].includes(Number(requestType))) ||
      //   [sdk.OffchainFeeReqType.OFFCHAIN_WITHDRAWAL].includes(
      //     Number(requestType)
      //   )) ||
      // (!isActiveAccount &&
      //   tokenSymbol &&
      //   amount &&
      //   AccountStatus.ACTIVATED === account.readyState &&
      //   walletLayer2Status === "UNSET" &&
      //   [sdk.OffchainFeeReqType.FAST_OFFCHAIN_WITHDRAWAL].includes(
      //     Number(requestType)
      //   )) ||
      (!isActiveAccount &&
        tokenAddress &&
        AccountStatus.ACTIVATED === account.readyState &&
        walletLayer2Status === "UNSET" &&
        [sdk.OffchainNFTFeeReqType.NFT_MINT].includes(Number(requestType)))
    ) {
      getFeeList();
    }

    return () => {
      if (nodeTimer.current !== -1) {
        clearTimeout(nodeTimer.current as NodeJS.Timeout);
      }
      getFeeList.cancel();
    };
  }, [
    tokenAddress,
    tokenSymbol,
    requestType,
    _intervalTime,
    _amount,
    account.readyState,
    walletLayer2Status,
  ]);

  return {
    chargeFeeTokenList,
    isFeeNotEnough,
    resetIntervalTime: () => {
      setIntervalTime(INTERVAL_TIME);
    },
    checkFeeIsEnough,
    handleFeeChange,
    feeInfo,
  };
}
