"use strict";

import React, { Component, PropTypes } from "react";

import Greeting from "metabase/lib/greeting";
import Icon from "metabase/components/Icon.react";

import HeaderTabs from "./HeaderTabs.react";
import Activity from "./Activity.react";
import Cards from "./Cards.react";
import RecentViews from "./RecentViews.react";
import CardFilters from "./CardFilters.react";
import Smile from './Smile.react';

export default class Homepage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            greeting: Greeting.simpleGreeting()
        };

        this.styles = {
            main: {
                marginRight: "346px",
            },
            mainWrapper: {
                maxWidth: "700px",
                marginLeft: "auto",
                marginRight: "auto",
            },
            sidebar: {
                borderWidth: "2px",
                width: "346px",
                backgroundColor: "#F9FBFC"
            },
            headerGreeting: {
                fontSize: "x-large"
            }
        };
    }

    render() {
        const { selectedTab, user } = this.props;

        return (
            <div>
                <div className="bg-brand text-white pl4">
                    <div style={this.styles.main}>
                        <div style={this.styles.mainWrapper}>
                            <header style={this.styles.headerGreeting} className="flex align-center pb4">
                                <span className="float-left mr2">
                                    <Smile />
                                </span>
                                <span>{(user) ? this.state.greeting + ' ' + user.first_name : this.state.greeting}</span>
                            </header>
                            <div className="">
                                <span className="float-left text-brand"><Icon className="mr3" name={'star'} height={36} width={36}></Icon></span>
                                <HeaderTabs {...this.props} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative pl4">
                    <div style={this.styles.main}>
                        <div style={this.styles.mainWrapper}>
                            { selectedTab === 'activity' ?
                                <Activity {...this.props} />
                            :
                                <Cards {...this.props} />
                            }
                        </div>
                    </div>
                    <div style={this.styles.sidebar} className="border-left absolute top right bottom">
                        { selectedTab === 'activity' ?
                            <RecentViews {...this.props} />
                        :
                            <CardFilters {...this.props} />
                        }
                    </div>
                </div>
            </div>
        );
    }
}

Homepage.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired
};
