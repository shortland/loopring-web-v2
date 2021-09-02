import styled from '@emotion/styled/macro'
import { Box, Container, Grid, Link, List, ListItem, Typography } from '@material-ui/core';
import { WithTranslation, withTranslation } from 'react-i18next';

const FooterDiv = styled(Box)`
  @media screen and (max-width: 1280px) {
    

  }
  font-size: 1.4rem;
  .MuiListItem-root{
    padding: 0;
    width: auto;
    max-width: initial;
    :hover{
       background:  var(--opacity);;
    }
  }
`

const Footer = withTranslation('layout')(({t}:WithTranslation) => {
    return <FooterDiv component={'footer'}  fontSize={'body1'}>
            <Container>
                <Box display={'flex'} alignItems={'center'} justifyContent={'center'}>
                    <List style={{display:'flex',alignItems:'center'}} >
                        <ListItem>
                            <Link color="textSecondary"href="https://medium.com/loopring-protocol">Medium</Link>
                            <Typography component={'span'} paddingX={2}>⭑</Typography>
                        </ListItem>
                        <ListItem>
                            <Link color="textSecondary"  href="https://twitter.com/loopringorg">
                                {'twitter'}
                            </Link>
                            <Typography component={'span'} paddingX={2}>⭑</Typography>
                        </ListItem>
                        <ListItem>
                            <Link color="textSecondary" href="https://discord.gg/KkYccYp">Discord</Link>
                            <Typography component={'span'} paddingX={2}>⭑</Typography>
                        </ListItem>
                        <ListItem>
                            <Link color="textSecondary" href="https://www.youtube.com/c/loopring">{t('labelYoutube')}</Link>
                            <Typography component={'span'} paddingX={2}>⭑</Typography>
                        </ListItem>
                        <ListItem>
                            <Link color="textSecondary" href="https://weibo.com/loopringfoundation">{t('labelWeibo')}</Link>
                        </ListItem>
                    </List> 
                </Box>
               
                <Typography component={'p'} style={{fontSize:'9px'}} variant={'body2'} paddingY={2} textAlign={'center'}>
                    <Typography component={'span'}>Copyright (c) 2017-{new Date().getFullYear()}.</Typography>
                    <Typography component={'span'}>All Rights Reversed by Loopring.</Typography>
                </Typography>
            </Container>
    </FooterDiv>
})

export default Footer
