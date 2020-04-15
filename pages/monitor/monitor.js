import React, { useState } from 'react';
import Head from 'next/head';

import Screen from '../../components/Screen.js';

import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.css';
import { Button, Container, Row, Col } from 'react-bootstrap';

const RoundContext = React.createContext();

class Main extends React.Component {
  static contextType = RoundContext;

  constructor(props, context) {
    super(props, context);
    this.lockedScreen = [false,false,false,false,false,false,false,false];
    this.disableDraw = false;
    this.socket = io('/monitor');
    this.state = {
      image: ['','','','','','','',''],
      status: [],
    }
    // console.log(this.props.teams)
  }

  componentDidMount() {
    this.socket.on('userChange', data => {
      // console.log(data);
      let teamId = this.props.teams.find(t => t.teamId == data.teamId).teamId-1;
      if (data.img && !this.lockedScreen[teamId]){
        /* console.log(teamId);
        console.log(data.img);
        console.log(this.state.image.map((val, i) => i == teamId ? data.img : val)); */
        this.setState(state => ({
          image: state.image.map((val, i) => i == teamId ? data.img : val)
        }));
        /* $(`.screen:eq(${teamId}) > div > img`).attr('src', data.img);
        $(`.screen:eq(${teamId}) > .box`).addClass('sent-box'); */
      }
    });
    this.socket.on('allUsers', data => {
      this.props.teams.forEach((team, index) => {
        if(data.hasOwnProperty(team.name)){
          this.setState(state => {
            image: state.image.map((val, i) => i == index ? data[team.name] : val)
          });
          // $(`.screen:eq(${index}) > div > img`).attr('src', data[team.name]);
        }
      });
    });
    this.socket.on('clear', data => {
      this.setState({
        image: ['', '', '', '', '', '', '', '']
      });
      // $('img').removeAttr('src');
    });
    this.socket.on('judge', data => {
      let status = [];
      for (let i in data) {
        status.push(data[i]);
        /* if (data[i] == 1) $(`.screen:eq(${i-1}) > div`).css('background', 'lime').css('color', 'black');
        else if (data[i] == -1) $(`.screen:eq(${i-1}) > div`).css('background', 'rgba(253, 16, 0, 0.72)').css('color', 'white');
        else if (data[i] == 0) $(`.screen:eq(${i-1}) > div`).css('background', '').css('color', 'black'); */
      }
      this.setState({ status });
    });
    this.socket.on('lockScreen', data => {
      this.lockedScreen[data.index] = data.value;
    });
    /* this.socket.on('changeNames',function(data){
      for(var i=1; i<=8; i++){
        $(`.screen:eq(${i-1}) > div > h3`).text(data['t'+i]);
      }
      console.log("Name has been changed");
    }); */
  }

  render() {
    let i = 0, x;
    let create = n => {
      let screen = [];
      for (x = i+n; i < x; i++) {
        screen.push(<Screen
          key={i}
          teamName={this.props.teams[i].name}
          image={this.state.image[i]}
          status={this.state.status[i]}
        />);
      }
      return screen;
    };
    if (this.context == 'sec') return (
      <Container fluid className="px-5 pt-3">
        <Row>
          {create(3)}
        </Row>
        <Row>
          <Col xs={2}/>
          {create(2)}
        </Row>
        <Row>
          {create(3)}
        </Row>
      </Container>
    );
    else if (this.context == 'fin') return (
      <Container>
        <Row>
        </Row>
      </Container>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <Head>
          <meta charSet="utf-8"/>
          <meta httpEquiv="x-ua-compatible" content="ie=edge"/>
          <meta name="apple-mobile-web-app-capable" content="yes"/>
          <title>Monitor</title>
          <meta name="description" content=""/>
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0"/>
          <link href="/css/monitor.css" rel="stylesheet"/>
        </Head>
        <RoundContext.Provider value={this.props.round}>
          <Main
            round={this.props.round}
            teams={this.props.teams}
          />
        </RoundContext.Provider>
      </>
    )
  }
}

App.getInitialProps = async ({ pathname, query, asPath, req, res, err }) => {
  return { teams: query.teams, round: query.round };
};  // https://stackoverflow.com/a/57977450/4468834

export default App