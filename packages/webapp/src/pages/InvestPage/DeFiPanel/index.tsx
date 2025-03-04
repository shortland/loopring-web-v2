import React from "react";
import styled from "@emotion/styled";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useTranslation,
  WithTranslation,
  withTranslation,
} from "react-i18next";
import { DeFiTradePanel } from "./DeFiTradePanel";
import {
  boxLiner,
  Button,
  ConfirmInvestDefiServiceUpdate,
  Toast,
  useSettings,
  LoadingBlock,
  ConfirmInvestDefiRisk,
} from "@loopring-web/component-lib";
import {
  confirmation,
  useDefiMap,
  useNotify,
  useToast,
} from "@loopring-web/core";
import { useHistory, useRouteMatch } from "react-router-dom";
import {
  BackIcon,
  defiRETHAdvice,
  defiWSTETHAdvice,
  Info2Icon,
  MarketType,
  TOAST_TIME,
  UpColor,
} from "@loopring-web/common-resources";

const StyleWrapper = styled(Box)`
  position: relative;
  border-radius: ${({ theme }) => theme.unit}px;

  .loading-block {
    background: initial;
  }

  .hasLinerBg {
    ${({ theme }) => boxLiner({ theme })}
  }

  border-radius: ${({ theme }) => theme.unit}px;
` as typeof Grid;
const StyleCardContent = styled(CardContent)`
  display: flex;
  &.tableLap {
    display: block;
    width: 100%;
    cursor: pointer;
    .content {
      flex-direction: column;
      align-items: center;
      padding-top: ${({ theme }) => 4 * theme.unit}px;
      .des {
        align-items: center;
        margin: ${({ theme }) => 3 * theme.unit}px 0;
      }
      .backIcon {
        display: none;
      }
    }
  }

  padding: 0;
  &:last-child {
    padding: 0;
  }

  &.isMobile {
    flex: 1;
    .content {
      flex-direction: row;
      width: 100%;
      .des {
        margin-left: ${({ theme }) => 2 * theme.unit}px;
        align-items: flex-start;
      }
    }
  }
` as typeof CardContent;

const LandDefiInvest = ({
  setConfirmedDefiInvest,
}: {
  setConfirmedDefiInvest: (props: {
    isShow: boolean;
    type: "RETH" | "WSETH";
  }) => void;
}) => {
  const history = useHistory();
  const { notifyMap } = useNotify();
  const { marketMap: defiMarketMap } = useDefiMap();
  const { t } = useTranslation("common");
  const { isMobile, upColor } = useSettings();
  const {
    confirmation: { confirmedRETHDefiInvest, confirmedWSETHDefiInvest },
  } = confirmation.useConfirmation();
  // const {
  //   confirmedRETHDefiInvest: confirmedRETHDefiInvestFun,
  //   confirmedWSETHDefiInvest: confirmedWSETHDefiInvestFun,
  // } = confirmation.useConfirmation();

  const investAdviceList = [
    {
      ...defiWSTETHAdvice,
      ...(notifyMap?.invest?.STAKE ? notifyMap?.invest?.STAKE[0] : {}),
      click: () => {
        if (!confirmedWSETHDefiInvest) {
          setConfirmedDefiInvest({ isShow: true, type: "WSETH" });
        } else {
          history.push(defiWSTETHAdvice.router);
        }
      },
      apy: defiMarketMap[defiWSTETHAdvice?.market ?? ""]?.apy,
    },
    {
      ...defiRETHAdvice,
      ...(notifyMap?.invest?.STAKE ? notifyMap?.invest?.STAKE[1] : {}),
      click: () => {
        if (!confirmedRETHDefiInvest) {
          setConfirmedDefiInvest({ isShow: true, type: "RETH" });
        } else {
          history.push(defiRETHAdvice.router);
        }
      },
      apy: defiMarketMap[defiRETHAdvice?.market ?? ""]?.apy,
    },
  ];

  return (
    <Box flex={1} display={"flex"} alignItems={"center"} alignSelf={"stretch"}>
      <Grid
        container
        spacing={isMobile ? 2 : 4}
        padding={3}
        flex={1}
        justifyContent={"center"}
      >
        {investAdviceList.map((item, index) => {
          return (
            <React.Fragment key={item.type + index}>
              {item.enable ? (
                <Grid item xs={12} md={4} lg={3}>
                  <Card sx={{ display: "flex" }} onClick={item.click}>
                    <StyleCardContent
                      className={isMobile ? "isMobile" : "tableLap"}
                    >
                      <Box
                        className={"content"}
                        display={"flex"}
                        flexDirection={"row"}
                        alignItems={"center"}
                      >
                        <Avatar
                          variant="circular"
                          style={{
                            height: "var(--svg-size-huge)",
                            width: "var(--svg-size-huge)",
                          }}
                          src={item.banner}
                        />
                        <Box
                          flex={1}
                          display={"flex"}
                          flexDirection={"column"}
                          paddingLeft={1}
                          className={"des"}
                        >
                          <Typography variant={"h4"}>
                            {t(item.titleI18n, { ns: "layout" })}
                          </Typography>
                          <Typography
                            variant={"body2"}
                            textOverflow={"ellipsis"}
                            whiteSpace={"pre"}
                            overflow={"hidden"}
                            color={"textSecondary"}
                          >
                            {t(item.desI18n, { ns: "layout" })}
                          </Typography>
                          {isMobile ? (
                            <Typography
                              variant={"body1"}
                              textOverflow={"ellipsis"}
                              whiteSpace={"pre"}
                              overflow={"hidden"}
                              paddingTop={1}
                              color={
                                upColor === UpColor.green
                                  ? "var(--color-success)"
                                  : "var(--color-error)"
                              }
                            >
                              {"APR: " + item.apy + "%"}
                            </Typography>
                          ) : (
                            <Typography
                              display={"flex"}
                              flexDirection={"column"}
                              alignItems={"center"}
                              marginTop={2}
                            >
                              <Typography
                                variant={"h3"}
                                color={
                                  upColor === UpColor.green
                                    ? "var(--color-success)"
                                    : "var(--color-error)"
                                }
                              >
                                {item.apy + "%"}
                              </Typography>
                              <Tooltip
                                title={t("labelEstRateAprDes").toString()}
                              >
                                <Typography
                                  variant={"body2"}
                                  display={"inline-flex"}
                                  alignItems={"center"}
                                  color={"var(--color-text-third)"}
                                >
                                  {t("labelEstRateApr")}
                                  <Info2Icon
                                    color={"inherit"}
                                    sx={{ marginLeft: 1 / 2 }}
                                  />
                                </Typography>
                              </Tooltip>
                            </Typography>
                          )}
                        </Box>
                        {isMobile ? (
                          <BackIcon
                            className={"backIcon"}
                            fontSize={"small"}
                            htmlColor={"var(--color-text-third)"}
                            sx={{
                              transform: "rotate(180deg)",
                            }}
                          />
                        ) : (
                          <Button
                            variant={"contained"}
                            fullWidth={true}
                            size={"medium"}
                          >
                            {t("labelInvestBtn")}
                          </Button>
                        )}
                      </Box>
                    </StyleCardContent>
                  </Card>
                </Grid>
              ) : (
                ""
              )}
            </React.Fragment>
          );
        })}
      </Grid>
    </Box>
  );
};
export const DeFiPanel: any = withTranslation("common")(
  ({ t }: WithTranslation & {}) => {
    const { marketArray } = useDefiMap();

    const {
      confirmedRETHDefiInvest: confirmedRETHDefiInvestFun,
      confirmedWSETHDefiInvest: confirmedWSETHDefiInvestFun,
    } = confirmation.useConfirmation();
    const [_confirmedDefiInvest, setConfirmedDefiInvest] = React.useState<{
      isShow: boolean;
      type?: "RETH" | "WSETH" | undefined;
    }>({ isShow: false, type: "WSETH" });

    const match: any = useRouteMatch("/invest/defi/:market?/:isJoin?");
    const [serverUpdate, setServerUpdate] = React.useState(false);
    const { toastOpen, setToastOpen, closeToast } = useToast();
    const history = useHistory();

    const _market: MarketType = [...(marketArray ? marketArray : [])].find(
      (_item) => {
        if (match?.params?.market) {
          //@ts-ignore
          const [, , base] = _item.match(/(defi-)?(\w+)(-\w+)?/i);
          //@ts-ignore
          const [_base] = match?.params?.market?.split("-");
          return base.toUpperCase() == _base.toUpperCase();
        }
      }
    ) as MarketType;
    const isJoin =
      match?.params?.isJoin?.toUpperCase() !== "Redeem".toUpperCase();

    return (
      <Box display={"flex"} flexDirection={"column"} flex={1} marginBottom={2}>
        <Box
          marginBottom={2}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Button
            startIcon={<BackIcon fontSize={"small"} />}
            variant={"text"}
            size={"medium"}
            sx={{ color: "var(--color-text-secondary)" }}
            color={"inherit"}
            onClick={() =>
              history.push(
                !_market
                  ? "/invest/overview"
                  : match?.params?.isJoin
                  ? "/invest/balance"
                  : "/invest/defi"
              )
            }
          >
            {t("labelInvestDefiTitle")}
            {/*<Typography color={"textPrimary"}></Typography>*/}
          </Button>
          <Button
            variant={"outlined"}
            sx={{ marginLeft: 2 }}
            onClick={() => history.push("/invest/balance/stack")}
          >
            {t("labelInvestMyDefi")}
          </Button>
        </Box>
        <StyleWrapper
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"center"}
          alignItems={"center"}
          flex={1}
        >
          {marketArray?.length ? (
            match?.params?.market && _market ? (
              <DeFiTradePanel
                market={_market}
                isJoin={isJoin}
                setServerUpdate={setServerUpdate}
                setToastOpen={setToastOpen}
              />
            ) : (
              <LandDefiInvest setConfirmedDefiInvest={setConfirmedDefiInvest} />
            )
          ) : (
            <LoadingBlock />
          )}
          <Toast
            alertText={toastOpen?.content ?? ""}
            severity={toastOpen?.type ?? "success"}
            open={toastOpen?.open ?? false}
            autoHideDuration={TOAST_TIME}
            onClose={closeToast}
          />

          <ConfirmInvestDefiServiceUpdate
            open={serverUpdate}
            handleClose={() => setServerUpdate(false)}
          />
          <ConfirmInvestDefiRisk
            open={_confirmedDefiInvest.isShow}
            type={_confirmedDefiInvest.type as any}
            handleClose={(_e, isAgree) => {
              if (!isAgree) {
                setConfirmedDefiInvest({ isShow: false });
              } else {
                if (_confirmedDefiInvest.type === "RETH") {
                  confirmedRETHDefiInvestFun();
                  history.push(defiRETHAdvice.router);
                }
                if (_confirmedDefiInvest.type === "WSETH") {
                  confirmedWSETHDefiInvestFun();
                  history.push(defiWSTETHAdvice.router);
                }
              }
              setConfirmedDefiInvest({ isShow: false });
            }}
          />
        </StyleWrapper>
      </Box>
    );
  }
);
