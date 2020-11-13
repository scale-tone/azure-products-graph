import React from 'react';
import { observer } from 'mobx-react';
import styled from 'styled-components';

import { AppBar, Box, Button, Link, Toolbar, Typography } from '@material-ui/core';

import GitHubIcon from '@material-ui/icons/GitHub';

import logo from './logo.svg';

@observer
export default class App extends React.Component {

    render(): JSX.Element {

        return (<>
            <AppBar position="static" color="default">
                <Toolbar>
                    <Typography variant="h4" color="inherit">
                        Azure Products Graph
                    </Typography>
                </Toolbar>
            </AppBar>

            <BottomBar position="fixed" color="transparent" ><Toolbar variant="dense">
                <Typography style={{ flex: 1 }} />
                <Button startIcon={<GitHubIcon />}
                    href="https://github.com/scale-tone/azure-products-graph"
                    target="_blank"
                >
                    Fork me on GitHub
                    </Button>
            </Toolbar></BottomBar>
        </>);
    }
}

const BottomBar: typeof AppBar = styled(AppBar)({
    top: 'auto',
    bottom: 0
})
