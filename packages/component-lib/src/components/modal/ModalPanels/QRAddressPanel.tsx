import QRCode from "qrcode.react";
import { Typography } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { Account, Info2Icon } from "@loopring-web/common-resources";
import styled from "@emotion/styled";
import { useSettings } from "../../../stores";
import { Button } from "../../basic-lib";

const BoxStyle = styled(Box)`
  ${({ theme }) =>
    theme.border.defaultFrame({ c_key: "blur", d_R: 1 / 2, d_W: 0 })};
  background: var(--provider-agree);
` as typeof Box;
export const QRAddressPanel = withTranslation("common")(
  ({
    isForL2Send,
    accAddress,
    isNewAccount,
    t,
    btnInfo,
  }: //    etherscanUrl,
  WithTranslation & {
    btnInfo: {
      btnTxt: string;
      callback: () => void;
    };
    etherscanUrl: string;
    isForL2Send: boolean;
    isNewAccount: boolean;
  } & Account) => {
    const { feeChargeOrder } = useSettings();
    //     const etherscanLink = etherscanUrl + 'address/' + accAddress;
    return (
      <Box
        flex={1}
        paddingY={2}
        paddingX={2}
        marginTop={-7}
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Typography variant={"h4"} marginBottom={2}>
          {t("labelReceiveAddress")}
        </Typography>
        {!!isForL2Send && (
          <BoxStyle marginBottom={2}>
            <Typography
              variant={"body1"}
              display={"inline-flex"}
              alignItems={"baseline"}
              color={"var(--color-warning)"}
              padding={2}
            >
              <Info2Icon
                sx={{ marginRight: 1, position: "relative", top: 2 }}
              />
              {isNewAccount
                ? t("labelReceiveAddressGuide", {
                    symbol: feeChargeOrder?.join(", "),
                  })
                : t("labelReceiveAddressGuide", { symbol: t("labelAssets") })}
            </Typography>
          </BoxStyle>
        )}
        <QRCode
          value={accAddress}
          size={240}
          style={{ padding: 8, backgroundColor: "#fff" }}
          aria-label={`address:${accAddress}`}
        />
        <Typography
          marginTop={3}
          variant={"body2"}
          color={"textSecondary"}
          style={{ wordBreak: "break-all" }}
        >
          {accAddress}
        </Typography>
        <Typography paddingTop={2} paddingBottom={1} variant={"body2"}>
          {t(
            isNewAccount
              ? "labelReceiveAddressDesActive"
              : "labelReceiveAddressDes"
          )}
        </Typography>
        <Box alignSelf={"stretch"} paddingX={5}>
          <Button
            variant={"contained"}
            fullWidth
            size={"medium"}
            onClick={(_e?: any) => {
              if (btnInfo?.callback) {
                btnInfo.callback();
              }
            }}
          >
            {btnInfo?.btnTxt}
          </Button>
        </Box>
      </Box>
    );
  }
);
