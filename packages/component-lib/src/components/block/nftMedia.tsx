import {
  AudioIcon,
  GET_IPFS_STRING,
  hexToRGB,
  ImageIcon,
  Media,
  myLog,
  NFTWholeINFO,
  PlayIcon,
  RefreshIcon,
  SoursURL,
  SyncIcon,
  VideoIcon,
} from "@loopring-web/common-resources";
import { Theme, useTheme } from "@emotion/react";
import React from "react";
import { Box, BoxProps, Modal, Tooltip, Typography } from "@mui/material";
import {
  cssBackground,
  EmptyDefault,
  MediaLabelStyled,
  ModalCloseButton,
  NftImage,
  NFTMedaProps,
  useImage,
  useOpenModals,
} from "../../index";
import { NFT_IMAGE_SIZES } from "@loopring-web/loopring-sdk";
import styled from "@emotion/styled";
import {
  useTranslation,
  WithTranslation,
  withTranslation,
} from "react-i18next";

const BoxStyle = styled(Box)<BoxProps & { theme: Theme }>`
  ${(props) => cssBackground(props)};
  width: 100%;
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(
    to bottom,
    var(--color-global-bg-opacity) 0%,
    var(--color-global-bg-opacity) 100%
  );
` as (prosp: BoxProps & { theme: Theme }) => JSX.Element;
const PlayIconStyle = styled(PlayIcon)`
  color: ${({ theme }) => hexToRGB(theme.colorBase.box, ".8")};
`;

export const NFTMedia = React.memo(
  React.forwardRef(
    (
      {
        item,
        shouldPlay = true,
        onNFTError,
        index,
        isOrigin = false,
        getIPFSString,
        baseURL,
      }: NFTMedaProps,
      ref: React.ForwardedRef<any>
    ) => {
      const vidRef = React.useRef<HTMLVideoElement>(null);
      const aidRef = React.useRef<HTMLAudioElement>(null);
      const theme = useTheme();
      const { t } = useTranslation();
      const {
        modals: {
          isShowNFTDetail: { isShow },
        },
      } = useOpenModals();
      const [play, setPlay] = React.useState(false);
      const [previewSrc, setPreviewSrc] = React.useState(
        (isOrigin
          ? item?.metadata?.imageSize[NFT_IMAGE_SIZES.original]
          : item?.metadata?.imageSize[NFT_IMAGE_SIZES.small]) ??
          getIPFSString(item?.image, baseURL)
        // item?.image?.startsWith(IPFS_HEAD_URL) ?
        // baseURL + `/api/v3/delegator/ipfs?path=${item?.image?.replace(IPFS_HEAD_URL_REG, '')}`: item?.image
        // item?.image?.replace(IPFS_HEAD_URL, IPFS_LOOPRING_SITE)
      );
      const { hasLoaded: previewSrcHasLoaded, hasError: previewSrcHasError } =
        useImage(previewSrc ?? "");
      const fullSrc = isOrigin
        ? getIPFSString(item?.image, baseURL)
        : item?.metadata?.imageSize[NFT_IMAGE_SIZES.original] ??
          getIPFSString(item?.image, baseURL);
      const { hasLoaded: fullSrcHasLoaded } = useImage(fullSrc ?? "");
      const typeSvg = React.useMemo(() => {
        myLog("item.__mediaType__", item.__mediaType__);
        switch (item.__mediaType__) {
          case Media.Audio:
            return (
              <>
                <Box
                  position={"absolute"}
                  right={theme.unit}
                  bottom={theme.unit}
                  borderRadius={"50%"}
                  sx={{ background: "var(--color-box)" }}
                  padding={3 / 2}
                  display={"inline-flex"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  zIndex={100}
                >
                  <AudioIcon
                    fontSize={"large"}
                    htmlColor={"var(--text-third)"}
                  />
                </Box>
                {item.animationUrl && shouldPlay && (
                  <Box
                    position={"absolute"}
                    left={"50%"}
                    bottom={theme.unit}
                    sx={{ transform: "translateX(-50%)" }}
                    zIndex={100}
                  >
                    <audio
                      src={getIPFSString(item?.animationUrl, baseURL)}
                      ref={aidRef}
                      controls
                      loop
                      className="w-full rounded-none h-12"
                      controlsList="nodownload"
                    />
                  </Box>
                )}
              </>
            );
          case Media.Video:
            return (
              <>
                <Box
                  position={"absolute"}
                  right={theme.unit}
                  bottom={theme.unit}
                  borderRadius={"50%"}
                  sx={{ background: "var(--color-box)" }}
                  padding={3 / 2}
                  display={"inline-flex"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  zIndex={100}
                >
                  <VideoIcon
                    fontSize={"large"}
                    htmlColor={"var(--text-third)"}
                  />
                </Box>

                {item.animationUrl && shouldPlay && !play && (
                  <Box
                    position={"absolute"}
                    left={"50%"}
                    top={"50%"}
                    zIndex={100}
                    sx={{
                      transform: "translate(-50% , -50%)",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlay(true);
                    }}
                  >
                    <PlayIconStyle
                      sx={{ minHeight: 72, minWidth: 72 }}
                      // width={60}
                      // height={60}
                      // htmlColor={"var(--color-text-disable)"}
                    />
                  </Box>
                )}
              </>
            );
          default:
            return <></>;
        }
      }, [item.__mediaType__, item.animationUrl, play, shouldPlay, theme.unit]);
      React.useEffect(() => {
        if (isShow === false && shouldPlay) {
          if (vidRef.current) {
            vidRef.current.pause();
          }
          if (aidRef.current) {
            aidRef.current.pause();
          }
        }
        return () => {
          if (vidRef.current) {
            vidRef.current.pause();
          }
          if (aidRef.current) {
            aidRef.current.pause();
          }
        };
      }, [isShow]);
      return (
        <BoxStyle
          ref={ref}
          theme={theme}
          flex={1}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          {!previewSrcHasLoaded ? (
            <Box
              flex={1}
              height={"100%"}
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <img
                className="loading-gif"
                width="36"
                src={`${SoursURL}images/loading-line.gif`}
              />
            </Box>
          ) : (
            <>
              {item && previewSrcHasError ? (
                <Box
                  flex={1}
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"center"}
                  onClick={async (event) => {
                    event.stopPropagation();
                    setPreviewSrc(
                      item?.metadata?.imageSize["160-160"] ??
                        getIPFSString(item?.image, baseURL)
                    );
                  }}
                >
                  <RefreshIcon style={{ height: 36, width: 36 }} />
                </Box>
              ) : (
                <>
                  {typeSvg}
                  <Box
                    alignSelf={"stretch"}
                    position={"relative"}
                    flex={1}
                    display={"flex"}
                    // style={{
                    //   background:
                    //     (!!fullSrc && fullSrcHasLoaded) || !!previewSrc
                    //       ? "var(--field-opacity)"
                    //       : "",
                    // }}
                  >
                    {play && shouldPlay ? (
                      <Box
                        display={"flex"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        flex={1}
                      >
                        <video
                          ref={vidRef}
                          src={getIPFSString(item?.animationUrl, baseURL)}
                          autoPlay
                          muted
                          controls
                          loop
                          controlsList="nodownload"
                          style={{ width: "100%" }}
                        />
                      </Box>
                    ) : !!fullSrc && fullSrcHasLoaded ? (
                      <NftImage
                        alt={item?.image}
                        {...item}
                        onError={() => undefined}
                        src={fullSrc}
                      />
                    ) : !!previewSrc ? (
                      <NftImage
                        alt={item?.image}
                        {...item}
                        onError={() => onNFTError(item, index)}
                        src={previewSrc}
                      />
                    ) : (
                      <EmptyDefault
                        style={{ flex: 1 }}
                        height={"100%"}
                        defaultPic={
                          <ImageIcon
                            htmlColor={"var(--color-text-third)"}
                            style={{ width: 80, height: 80 }}
                          />
                        }
                        message={() => (
                          <></>
                          // <Box
                          //   flex={1}
                          //   display={"flex"}
                          //   alignItems={"center"}
                          //   justifyContent={"center"}
                          // >
                          //   {t("labelNoCollectionCover")}
                          // </Box>
                        )}
                      />
                    )}
                  </Box>
                </>
              )}
            </>
          )}

          {item?.pendingOnSync ? (
            <Tooltip
              title={t("labelMintInSyncTooltips").toString()}
              placement={"top"}
            >
              <MediaLabelStyled
                position={"absolute"}
                left={0}
                top={0}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <SyncIcon color={"inherit"} />
                <Typography
                  color={"inherit"}
                  component={"span"}
                  paddingLeft={1}
                >
                  {t("labelSync")}
                </Typography>
              </MediaLabelStyled>
            </Tooltip>
          ) : (
            ""
          )}
        </BoxStyle>
      );
    }
  )
);
const ModalFullStyled = styled(Box)`
  & > div {
    background: var(--color-global-bg-opacity);
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .close-button {
    margin-top: 0;
  }
` as typeof Box;

export const ZoomMedia = withTranslation("common")(
  ({
    t,
    open,
    onClose,
    getIPFSString,
    baseURL,
    nftItem,
    className = "",
    ...rest
  }: WithTranslation & {
    open: boolean;
    nftItem: Partial<NFTWholeINFO>;
    onClose: (event: any) => void;
    className?: string;
    getIPFSString: GET_IPFS_STRING;
    baseURL: string;
  }) => {
    const ref = React.useRef();
    // const { language } = useSettings();
    return (
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <ModalFullStyled
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          className={className ?? ""}
        >
          <Box
            className={"content"}
            paddingTop={3}
            paddingBottom={3}
            display={"flex"}
            flexDirection={"column"}
          >
            <ModalCloseButton
              className="full-btn-close"
              onClose={onClose}
              {...{ ...rest, t }}
            />
            <Box
              position={"absolute"}
              top={0}
              right={0}
              bottom={0}
              left={0}
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <NFTMedia
                ref={ref}
                item={nftItem as Partial<NFTWholeINFO>}
                shouldPlay={true}
                onNFTError={() => undefined}
                isOrigin={true}
                getIPFSString={getIPFSString}
                baseURL={baseURL}
              />
            </Box>
          </Box>
        </ModalFullStyled>
      </Modal>
    );
  }
);
