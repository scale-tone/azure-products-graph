import React from 'react';
import { observer } from 'mobx-react';
import styled from 'styled-components';

import { AppBar, Box, Button, LinearProgress, Menu, MenuItem, Slider, TextField, Toolbar, Typography } from '@material-ui/core';
import { Graph } from "react-d3-graph";

import logo from './logo.svg';
import { AppState } from './AppState';

@observer
export default class App extends React.Component<{ state: AppState }> {

    componentDidMount() {
        this.props.state.load();
    }

    render(): JSX.Element {
        const state = this.props.state;

        return (<>
            <AppBar position="static" color="default">
                <Toolbar>

                    <img src={logo} width="30px" alt="" />
                    <Box width={30} />

                    <TitleTypography variant="h5" color="inherit">
                        Azure Products Graph
                    </TitleTypography>

                    <ZoomSlider value={state.zoomLevel} min={0.5} max={5} step={0.1} 
                        onChange={(evt, newValue) => {state.zoomLevel = newValue as number}}
                    />

                    <FilterTextField
                        margin="dense"
                        label="Filter by"
                        InputLabelProps={{ shrink: true }}
                        placeholder="e.g. 'sql'"
                        disabled={state.inProgress}
                        value={state.filterText}
                        onChange={(evt) => state.filterText = evt.target.value as string}
                        onKeyPress={(evt: React.KeyboardEvent<HTMLInputElement>) => this.handleKeyPress(evt)}
                    />

                    <FilterButton
                        variant="outlined"
                        color="default"
                        size="large"
                        disabled={state.inProgress}
                        onClick={() => state.load()}
                    >
                        Filter
                    </FilterButton>
                </Toolbar>
            </AppBar>

            {!!state.inProgress && (<LinearProgress />)}

            <Menu
                anchorEl={state.popupAnchorElement}
                keepMounted
                open={!!state.popupAnchorElement}
                onClose={() => state.popupAnchorElement = undefined}
            >
                {state.selectedProducts.map(product => {
                    return (
                        <MenuItem key={product.title} onClick={() => state.onProductSelected(product)}>{product.title}</MenuItem>
                    )
                })}

            </Menu>

            {!state.inProgress && state.nodes.length > 0 && state.links.length > 0 && (
                <Graph
                    id="graph-id"
                    data={{ nodes: state.nodes, links: state.links }}

                    config={{

                        height: window.innerHeight - 100,
                        width: window.innerWidth,
                        initialZoom: state.zoomLevel,

                        node: {
                            color: "#50E6FF",
                            labelPosition: 'center',
                        },

                        link: {
                            renderLabel: true
                        },

                        d3: {
                            linkLength: 200,
                            gravity: -70
                        }
                    }}

                    onClickLink={(source, target) => state.onLinkSelected(source, target)}
                    onClickNode={(keyword) => state.onNodeSelected(keyword)}
                />
            )}

            <GithubLink href="https://github.com/scale-tone/azure-products-graph" target="_blank">
                <img loading="lazy" width="149" height="149" src="https://github.blog/wp-content/uploads/2008/12/forkme_right_white_ffffff.png?resize=149%2C149" alt="Fork me on GitHub" data-recalc-dims="1" />
            </GithubLink>

        </>);
    }

    private handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            // Otherwise the event will bubble up and the form will be submitted
            event.preventDefault();

            this.props.state.load();
        }
    }
}

const TitleTypography: typeof Typography = styled(Typography)({
    minWidth: 280
});

const ZoomSlider: typeof Slider = styled(Slider)({
    minWidth: 100,
    marginRight: 50
});

const FilterTextField: typeof TextField = styled(TextField)({
    minWidth: 200,
    marginRight: 20
});

const FilterButton: typeof Button = styled(Button)({
    minWidth: 100,
    marginRight: 120
});

const GithubLink = styled.a({
    position: 'absolute',
    right: 0,
    top: 0
});