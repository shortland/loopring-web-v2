import { ImportCollectionStep, ImportCollectionViewProps } from "./Interface";
import { Trans, useTranslation } from "react-i18next";
import React from "react";
import {
  Box,
  Grid,
  Typography,
  Stepper,
  StepLabel,
  Step,
  ListItemText,
  Tab,
  Tabs,
} from "@mui/material";
import {
  myLog,
  getShortAddr,
  BackIcon,
  DropDownIcon,
} from "@loopring-web/common-resources";
import {
  TextField,
  TGItemData,
  Button,
  BtnInfo,
  MenuItem,
  CollectionInput,
} from "../../basic-lib";
import { CollectionMeta, NFTType } from "@loopring-web/loopring-sdk";
import styled from "@emotion/styled";
import { useSettings } from "../../../stores";
import * as sdk from "@loopring-web/loopring-sdk";

export enum TabNFTManage {
  Undecided = "Undecided",
  Others = "Others",
  Current = "Current",
  All = "All",
}
export const CollectionManageWrap = <
  Co extends CollectionMeta,
  NFT extends sdk.UserNFTBalanceInfo
>({
  onNFTSelected,
  onNFTSelectedMethod,
  onFilterNFT,
}: // btnMain,
{
  onNFTSelected: (item: NFT[]) => void;
  onNFTSelectedMethod: (item: NFT[], method: string) => void;
  onFilterNFTL: (filter: any) => void;
  // btnMain:(props:{
  //   defaultLabel?: string;
  //   btnInfo?: BtnInfo;
  //   disabled: () => boolean;
  //   onClick: () => void;
  //   fullWidth?: boolean;
  // })=>void
}) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useSettings();
  const [tab, setTab] = React.useState<TabNFTManage>(TabNFTManage.Undecided);
  const handleTabChange = React.useCallback((_e, value) => {
    setTab(value);
  }, []);
  // @ts-ignore
  return (
    <Box
      // className={walletMap ? "" : "loading"}
      display={"flex"}
      flex={1}
      flexDirection={"column"}
      padding={5 / 2}
      alignItems={"center"}
    >
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="disabled tabs example"
      >
        {Object.keys(TabNFTManage).map((item) => {
          return <Tab key={item.toString()} value={item.toString()}></Tab>;
        })}
        {/*<Tab label={t("labelLiquidityDeposit")} value={0} />*/}
        {/*<Tab label={t("labelLiquidityWithdraw")} value={1} />*/}
      </Tabs>
    </Box>
  );
  // Undecided  12
  // Others 100
  // Current Collection 100
  // All 1000
  // Search
};
