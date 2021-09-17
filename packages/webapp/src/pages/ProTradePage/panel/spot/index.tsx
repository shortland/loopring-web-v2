import { WithTranslation, withTranslation } from 'react-i18next';
import React from 'react';
import { AlertImpact, ConfirmImpact, LimitTrade, MarketTrade, Toast } from '@loopring-web/component-lib';
import { TOAST_TIME } from '../../../../defs/common_defs';
import { MarketType } from '@loopring-web/common-resources';
import { usePageTradePro } from '../../../../stores/router';
import { useMarket } from './hookMarket';
import { useLimit } from './hookLimit';
import { Box, Divider, Tab, Tabs } from '@mui/material';

// const TabsStyle = styled(Tabs)`
//   flex: 1;
//   width: 100%;
// ` as typeof Tabs
export enum TabIndex {
    market = 'market',
    limit = 'limit'
}

export const SpotView = withTranslation('common')(<C extends { [ key: string ]: any }>({
                                                                                           t, market
                                                                                           // ,marketTicker
                                                                                       }: {
    market: MarketType,
    // marketTicker:  MarketBlockProps<C>
} & WithTranslation) => {
    const {pageTradePro} = usePageTradePro();
    const [tabIndex, setTabIndex] = React.useState<TabIndex>(TabIndex.market)
    const {
        toastOpenL, closeToastL, limitTradeData, onChangeLimitEvent,
        tradeLimitI18nKey,
        tradeLimitBtnStatus,
        limitBtnClick,
        isLimitLoading,
    } = useLimit(market)
    const {
        alertOpen, confirmOpen, toastOpen, closeToast,
        marketTradeData, onChangeMarketEvent,
        tradeMarketI18nKey,
        tradeMarketBtnStatus,
        marketSubmit,
        marketBtnClick,
        isMarketLoading,

    } = useMarket(market)
    return <>
        <Toast alertText={toastOpen?.content ?? ''} severity={toastOpen?.type ?? 'success'}
               open={toastOpen?.open ?? false}
               autoHideDuration={TOAST_TIME} onClose={closeToast}/>
        <Toast alertText={toastOpenL?.content ?? ''} severity={toastOpenL?.type ?? 'success'}
               open={toastOpenL?.open ?? false}
               autoHideDuration={TOAST_TIME} onClose={closeToastL}/>
        <AlertImpact handleClose={marketSubmit} open={alertOpen} value={pageTradePro?.priceImpactObj?.value as any}/>
        <ConfirmImpact handleClose={marketSubmit} open={confirmOpen}
                       value={pageTradePro?.priceImpactObj?.value as any}/>
        <Box display={'flex'} flexDirection={'column'} alignItems={'stretch'}>
            <Box component={'header'} width={'100%'}>
                <Tabs variant={'fullWidth'} value={tabIndex} onChange={(_e, value) => {
                    setTabIndex(value)
                }}>
                    <Tab value={TabIndex.limit} label={t('labelProLimit')}/>
                    <Tab value={TabIndex.market} label={t('labelProMarket')}/>
                </Tabs>
            </Box>
            <Divider style={{marginTop: '-1px'}}/>
            <Box flex={1} component={'section'}>
                {tabIndex === TabIndex.limit && <LimitTrade
                  disabled={false}
                  tokenBaseProps={{disabled: isLimitLoading}}
                  tokenQuoteProps={{disabled: isLimitLoading}}
                  tradeLimitI18nKey={tradeLimitI18nKey}
                  tradeLimitBtnStatus={tradeLimitBtnStatus}
                  handleSubmitEvent={limitBtnClick}
                  tradeCalcProData={pageTradePro.tradeCalcProData}
                  tradeData={limitTradeData}
                  onChangeEvent={onChangeLimitEvent}/>}
                {tabIndex === TabIndex.market && <MarketTrade
                  disabled={false}
                  tokenBaseProps={{disabled: isMarketLoading}}
                  tokenQuoteProps={{disabled: isMarketLoading}}
                  tradeMarketI18nKey={tradeMarketI18nKey}
                  tradeMarketBtnStatus={tradeMarketBtnStatus}
                  handleSubmitEvent={marketBtnClick}
                  tradeCalcProData={pageTradePro.tradeCalcProData}
                  tradeData={marketTradeData}
                  onChangeEvent={onChangeMarketEvent}/>}
            </Box>

        </Box>
    </>
})

