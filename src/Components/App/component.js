/*eslint-disable no-console */
import React, { Component } from 'react';

import axios from 'axios';
import { socketConnect } from 'socket.io-react';

import { Grid, Row, Col } from 'react-bootstrap';
import BababaButton from '../BababaButton/component';
import ReactHowler from 'react-howler';
import ReasonTextbox from '../ReasonTextbox/component';
import BababaFeed from '../BababaFeed/component';
import GroupManager from '../GroupManager/component';

class App extends Component {
    state = {
        playing: false,
        reason: "",
        messages: []
    };

    readFeed = (group) => {
        axios.get(this.props.apiServerRoot + "/api/readFeed/" + encodeURIComponent(group))
        .then( (res) => {
            this.setState({messages: res.data.messages});
        });
    }

    subscribe = (group) => {
        this.props.socket.on('bababa-' + group, (data) => {
            this.setState((prevState) => {
                let newState = {};
                
                newState.playing = true
                
                if (data.message) {
                    newState.messages = [
                        {
                            message: data.message,
                            group: group,
                            createdUts: Math.floor(Date.now() / 1000)
                        }
                    ].concat(prevState.messages)
                }
                return newState;
            });
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.group !== this.props.group) {
            if (nextProps.group) {
                this.readFeed(nextProps.group);
                this.subscribe(nextProps.group);
            }
        }
    }

// shared methods
    playAudio = () => {
        this.setState({playing: true});
    }
    
    stopAudio = () => {
        this.setState({playing: false});
    }

// button events
    buttonOnClick = () => {
        this.playAudio();
        
        let data = {};
        if (this.props.group && this.state.reason.length > 0) {
            data.message = this.state.reason;
            data.group = this.props.group;
        }

        this.props.socket.emit('bababa', data);

        this.setState({reason: ""})
    }

// reason textbox events
    reasonOnChange = (e) => {
        this.setState({reason: e.target.value});
    }

// audio events
    audioOnEnd = () => {
        this.stopAudio();
    }

    render() {
        return(
            <Grid>
                <Row style={{marginBottom: "40px"}}>
                    <Col xs={12}>
                        <GroupManager groupName={this.props.group} onGroupChange={this.props.onGroupChange}/>
                    </Col>
                </Row>
                <Row style={{marginBottom: "20px"}} className={this.props.group ? "" : "hidden"}>
                    <Col xs={12}>
                        <ReasonTextbox 
                            value={this.state.reason} 
                            onChange={this.reasonOnChange}
                        />
                    </Col>
                </Row>       
                <Row style={{marginBottom: "40px"}}>
                    <Col xs={12}>
                        <BababaButton 
                            onClick={this.buttonOnClick}
                            buttonDisabled={this.state.playing}
                        />
                    </Col>
                </Row>
                <Row className={this.props.group ? "" : "hidden"}>
                    <Col xs={12}>
                        <h2>{this.props.group + " Bababas"}</h2>
                        <BababaFeed messages={this.state.messages}/>
                    </Col>
                </Row>
                <ReactHowler 
                    src="/airhorn.mp3" 
                    html5={true} 
                    playing={this.state.playing} 
                    onPlay={this.audioOnStart} 
                    onEnd={this.audioOnEnd}
                />
            </Grid>
        )
    }
}

export default socketConnect(App);
