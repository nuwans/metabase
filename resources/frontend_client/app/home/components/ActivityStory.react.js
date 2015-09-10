'use strict';

import React, { Component } from 'react';

export default class ActivityStory extends Component {
    constructor() {
        super()
        this.styles = {
            modelLink: {
                borderWidth: "2px"
            },
        }
    }
    render() {
        const { story } = this.props
        return (
            <div className="ml2 mt1 border-left flex" style={{borderWidth: '3px'}}>
                <div style={this.styles.modelLink} className="flex full ml4 bordered rounded p2">
                    <a className="link" href={story.bodyLink}>{story.body}</a>
                </div>
            </div>
        )
    }
}
