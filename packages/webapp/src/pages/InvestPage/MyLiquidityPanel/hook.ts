import { AmmPoolActivityRule, LoopringMap } from "@loopring-web/loopring-sdk";
import React from "react";
import { AmmRecordRow, MyPoolRow } from "@loopring-web/component-lib";
import {
  makeWalletLayer2,
  useAmmMap,
  useTokenMap,
  useWalletLayer2,
  useUserRewards,
  getUserAmmTransaction,
  makeMyAmmMarketArray,
  makeMyPoolRowWithPoolState,
  makeSummaryMyAmm,
  useWalletLayer2Socket,
  useTokenPrices,
  SummaryMyInvest,
  useDefiMap,
  makeDefiInvestReward,
  volumeToCountAsBigNumber,
} from "@loopring-web/core";
import { RowInvestConfig, SagaStatus } from "@loopring-web/common-resources";
import * as sdk from "@loopring-web/loopring-sdk";

export const useOverview = <
  R extends { [key: string]: any },
  I extends { [key: string]: any }
>({
  dualOnInvestAsset,
  rowConfig = RowInvestConfig,
  hideSmallBalances,
}: {
  ammActivityMap: LoopringMap<LoopringMap<AmmPoolActivityRule[]>> | undefined;
  dualOnInvestAsset: any; //RawDataDualAssetItem[];
  rowConfig?: any;
  hideSmallBalances: boolean;
}): {
  myAmmMarketArray: AmmRecordRow<R>[];
  summaryMyInvest: Partial<SummaryMyInvest>;
  myPoolRow: MyPoolRow<R>[];
  showLoading: boolean;
  filter: { searchValue: string };
  tableHeight: number;
  handleFilterChange: (props: { searchValue: string }) => void;
} => {
  const { status: walletLayer2Status } = useWalletLayer2();
  const { status: userRewardsStatus, userRewardsMap } = useUserRewards();
  const { tokenMap, idIndex } = useTokenMap();
  const { marketCoins: defiCoinArray } = useDefiMap();
  const { status: ammMapStatus, ammMap } = useAmmMap();
  const { tokenPrices } = useTokenPrices();

  const [summaryMyInvest, setSummaryMyInvest] = React.useState<
    Partial<SummaryMyInvest>
  >({});
  const [filter, setFilter] = React.useState({
    searchValue: "",
  });
  const [totalData, setTotalData] = React.useState<MyPoolRow<R>[]>([]);
  const [myPoolRow, setMyPoolRow] = React.useState<MyPoolRow<R>[]>([]);
  const [tableHeight, setTableHeight] = React.useState(0);
  const resetTableData = React.useCallback(
    (viewData) => {
      setMyPoolRow(viewData);
      setTableHeight(
        rowConfig.rowHeaderHeight + viewData.length * rowConfig.rowHeight
      );
    },
    [rowConfig.rowHeaderHeight, rowConfig.rowHeight]
  );
  const updateData = React.useCallback(() => {
    let resultData: MyPoolRow<R>[] =
      totalData && !!totalData.length ? totalData : [];
    // if (filter.hideSmallBalance) {
    if (hideSmallBalances) {
      resultData = resultData.filter((o) => !o.smallBalance);
    }
    if (filter.searchValue) {
      resultData = resultData.filter(
        (o) =>
          o.ammDetail.coinAInfo.name
            .toLowerCase()
            .includes(filter.searchValue.toLowerCase()) ||
          o.ammDetail.coinBInfo.name
            .toLowerCase()
            .includes(filter.searchValue.toLowerCase())
      );
    }
    resetTableData(resultData);
  }, [totalData, filter, hideSmallBalances, resetTableData]);
  const handleFilterChange = React.useCallback(
    (filter) => {
      setFilter(filter);
    },
    [setFilter]
  );
  React.useEffect(() => {
    updateData();
  }, [totalData, filter, hideSmallBalances]);

  const [myAmmMarketArray, setMyAmmMarketArray] = React.useState<
    AmmRecordRow<R>[]
  >([]);
  const [showLoading, setShowLoading] = React.useState(false);
  const mountedRef = React.useRef(false);

  const walletLayer2DoIt = React.useCallback(async () => {
    const { walletMap: _walletMap } = makeWalletLayer2(false);
    if (_walletMap) {
      const res = await getUserAmmTransaction({});
      let _myTradeArray = makeMyAmmMarketArray(
        undefined,
        res ? res.userAmmPoolTxs : []
      );
      if (mountedRef.current) {
        setMyAmmMarketArray(_myTradeArray ? _myTradeArray : []);
      }
    }
    return _walletMap;
  }, []);

  const makeMyPoolRow = React.useCallback(
    async (_walletMap): Promise<MyPoolRow<R>[]> => {
      let totalCurrentInvest = {
        investDollar: 0,
      };
      if (_walletMap && ammMap && userRewardsMap && tokenPrices) {
        // @ts-ignore
        const _myPoolRow: MyPoolRow<R>[] = Reflect.ownKeys(_walletMap).reduce(
          (prev, walletKey) => {
            if (/LP-/i.test(walletKey as string)) {
              const ammKey = walletKey.toString().replace("LP-", "AMM-");
              const marketKey = walletKey.toString().replace("LP-", "");
              let rowData: MyPoolRow<R> | undefined;
              rowData = makeMyPoolRowWithPoolState({
                ammDetail: ammMap[ammKey],
                walletMap: _walletMap,
                market: marketKey,
                ammUserRewardMap: userRewardsMap,
              }) as any;
              if (rowData !== undefined) {
                prev.push(rowData);
              }
            }

            return prev;
          },
          [] as MyPoolRow<R>[]
        );

        const formattedPoolRow = _myPoolRow.map((o: MyPoolRow<R>) => {
          const market = `LP-${o.ammDetail?.coinAInfo.simpleName}-${o.ammDetail?.coinBInfo.simpleName}`;
          const totalAmount = o.totalLpAmount ?? 0;
          const totalAmmValueDollar = (tokenPrices[market] || 0) * totalAmount;
          const coinA = o.ammDetail?.coinAInfo?.simpleName;
          const coinB = o.ammDetail?.coinBInfo?.simpleName;
          const precisionA = tokenMap ? tokenMap[coinA]?.precision : undefined;
          const precisionB = tokenMap ? tokenMap[coinB]?.precision : undefined;
          totalCurrentInvest.investDollar += Number(o.balanceDollar ?? 0);
          return {
            ...o,
            totalAmmValueDollar,
            precisionA,
            precisionB,
          };
        });
        defiCoinArray?.forEach((defiCoinKey) => {
          totalCurrentInvest.investDollar += Number(
            (_walletMap[defiCoinKey]?.count.replace(sdk.SEP, "") ?? 0) *
              tokenPrices[defiCoinKey] ?? 0
          );
        }, []);
        if (dualOnInvestAsset) {
          Object.keys(dualOnInvestAsset).forEach((key) => {
            const item = dualOnInvestAsset[key];
            const { amount, tokenId } = item;
            const tokenInfo = tokenMap[idIndex[tokenId]];
            totalCurrentInvest.investDollar +=
              volumeToCountAsBigNumber(tokenInfo.symbol, amount)
                ?.times(tokenPrices[tokenInfo.symbol] ?? 0)
                .toNumber() ?? 0;
          });
        }

        setSummaryMyInvest((state) => {
          return {
            ...state,
            ...totalCurrentInvest,
          };
        });
        return formattedPoolRow as any;
      }
      return [];
    },
    [ammMap, userRewardsMap, tokenPrices, tokenMap, dualOnInvestAsset]
  );

  const walletLayer2Callback = React.useCallback(async () => {
    if (ammMap && tokenPrices && userRewardsMap) {
      setShowLoading(true);
      const _walletMap = await walletLayer2DoIt();
      const _myPoolRow = await makeMyPoolRow(_walletMap);
      setTotalData(_myPoolRow);
      setShowLoading(false);
    }
  }, [ammMap, tokenPrices, userRewardsMap, walletLayer2DoIt, makeMyPoolRow]);

  useWalletLayer2Socket({ walletLayer2Callback });
  React.useEffect(() => {
    if (
      ammMapStatus === SagaStatus.UNSET &&
      userRewardsStatus === SagaStatus.UNSET &&
      walletLayer2Status === SagaStatus.UNSET
    ) {
      walletLayer2Callback();
    }
  }, [ammMapStatus, userRewardsStatus, walletLayer2Status, dualOnInvestAsset]);

  React.useEffect(() => {
    mountedRef.current = true;
    setShowLoading(true);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (userRewardsStatus === SagaStatus.UNSET) {
      let summaryReward: any = makeSummaryMyAmm({ userRewardsMap }) ?? {};
      makeDefiInvestReward().then((summaryDefiReward) => {
        summaryReward.rewardDollar = sdk
          .toBig(summaryReward?.rewardDollar ?? 0)
          .plus(summaryDefiReward ?? 0)
          .toString();
        setSummaryMyInvest((state) => {
          return {
            ...state,
            ...summaryReward,
          };
        });
      });

      walletLayer2Callback();
    }
  }, [userRewardsStatus]);
  return {
    myAmmMarketArray,
    summaryMyInvest,
    myPoolRow,
    showLoading,
    filter,
    tableHeight,
    handleFilterChange,
  };
};
