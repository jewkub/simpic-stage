import React, { useState } from 'react';
import Head from 'next/head';

import Log from '../components/Log';
import JudgeResult from '../components/JudgeResult';

import io from 'socket.io-client';
import * as moment from 'moment';
import 'bootstrap/dist/css/bootstrap.css';
import { Button, Container, Row, Col, FormControl, InputGroup, Card } from 'react-bootstrap';

const RoundContext = React.createContext();

class Main extends React.Component {
  static contextType = RoundContext;

  constructor(props, context) {
    super(props, context);
    this.state = {
      timeLimit: props.defaultTimeLimit,
      timeLeft: 0,
      log: [],
      judgeResult: [],
      score: [],

    }
    this.socket = io('/cp');

    this.scoreChange = this.scoreChange.bind(this);
  }

  componentDidMount() {
    this.socket.on('activateDraw', data => {
      data.time = new Date(data.time);
      let logTime = this.getLogTime(data.time);
      this.setState(state => {
        state.log.push(<li data-tags='activate'>{logTime} Activate for <span className="tag is-success">{state.timeLimit}</span> second(s)</li>)
        return { log: state.log };
      });

      this.startTime = moment();
      this.setState({
        timeLeft: this.props.timeLimit
      }, () => {
        this.countdown = setInterval(() => {
          this.setState(state => {
            if (state.timeLeft <= 0) {
              window.clearInterval(this.countdown);
              return { timeLeft: 0 };
            }
            return { timeLeft: moment(this.startTime).add(state.timeLimit, 's').diff(moment())/1000 };
          });
        }, 25);
      });
      /* for(var i=1; i<=8; i++){
        $('#text-t'+i).val('0.00');
        document.querySelector('input[type="radio"][name*="'+i+'"][value="correct"]').checked = false;
        document.querySelector('input[type="radio"][name*="'+i+'"][value="wrong"]').checked = false;
        document.querySelector('input[type="radio"][name*="'+i+'"][value="notAnswer"]').checked = false;
      } */
    });

    this.socket.on('forceFinish', data => {
      clearInterval(this.countdown);
      this.setState({
        timeLeft: 0
      });
    });
  }

  scoreChange(score, i) {
    this.setState(state => {
      state.score[i] = score;
      return state.score;
    });
  }

  calculateScore(timeLeft) {
    if (timeLeft > 50.00) return 20.00;
    return 10.00 + timeLeft/5.00;
  }

  getUserLog(teamId) {
    return (<span className="tag is-primary">{teamId}: {this.props.teams[teamId-1].name}</span>);
  }

  getLogTime(date) {
    return <span className="tag is-black" style={{ marginRight: '30px' }}>{moment(date).format('HH:mm:ss:SSS')}</span>;
  }

  render() {
    if (this.context == 'second') return (
      <Container>
        <br/>
        <Row>
          <Col xs="6">
            <Card>
              <Card.Body>
                <Row>
                  <InputGroup className="col-6">
                    <FormControl
                      placeholder="Time limit"
                      type="number"
                      value={this.state.timeLimit}
                      onChange={e => {
                        console.log(e.target.value);
                        this.setState({timeLimit: e.target.value});
                      }}
                    />
                    <InputGroup.Append>
                      <Button
                        onClick={e => {
                          e.preventDefault();
                          if (this.state.timeLimit <= 0) return ;
                          if (this.state.timeLeft != 0) return alert('Please force finish before activate new session');
                          this.socket.emit('activate', { second: this.state.timeLimit });
                          this.setState({
                            timeLimit: this.props.defaultTimeLimit
                          });
                          // $('#second').val(timeCount);
                        }}
                      >
                        Activate
                      </Button>
                    </InputGroup.Append>
                  </InputGroup>
                  <Col xs="6">
                    <Button
                      onClick={e => {
                        e.preventDefault();
                        this.socket.emit('forceFinish', true);
                      }}
                    >
                      Force Finish
                    </Button>
                  </Col>
                </Row>
                <h3 id="clock" className="is-size-5">Time left: {this.state.timeLeft ? this.state.timeLeft.toFixed(2) : '--.--'} second(s)</h3>
              </Card.Body>
            </Card>
            <br/>
            <Card>
              <Card.Body>
                <Log log={this.state.log}/>
              </Card.Body>
            </Card>
          </Col>
          <Col xs="6">
            <Card>
              <Card.Body>
                <JudgeResult
                  teams={this.props.teams}
                  scoreChange={this.scoreChange}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
    else if (this.context == 'final') return (
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
          <title>Console</title>
          <meta name="description" content=""/>
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
          <link href="/css/console.css" rel="stylesheet"/>
        </Head>
        <RoundContext.Provider value={this.props.round}>
          <Main
            round={this.props.round}
            teams={this.props.teams}
            defaultTimeLimit={this.props.defaultTimeLimit}
          />
        </RoundContext.Provider>
      </>
    )
  }
}

App.getInitialProps = async ({ pathname, query, asPath, req, res, err }) => {
  return query;
};  // https://stackoverflow.com/a/57977450/4468834

export default App