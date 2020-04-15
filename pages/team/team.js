import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'
import Canvas from '../../components/Canvas.js';

import 'bootstrap/dist/css/bootstrap.css';
import { Button } from 'react-bootstrap';
// import { fabric } from 'fabric';

import swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const Swal = withReactContent(swal);

class Main extends React.Component {
  constructor(props){
    super(props);
    this.setSubmitButton = this.setSubmitButton.bind(this);
    this.setTimeLeft = this.setTimeLeft.bind(this);
    this.canvasRef = React.createRef();

    this.state = {
      timeLeft: 0,
      submitButton: {
        disabled: true
      }
    }
  }
  setTimeLeft(t) {
    // t = +t;
    if (!t.toFixed) throw new Error('t is not a number');
    if (t < 0) t = 0;
    t = +t.toFixed(2);
    this.setState({
      timeLeft: t
    });
    if (t > 0) return ;

  }
  setSubmitButton(s) {
    this.setState({
      submitButton: s
    });
  }
  render() {
    return (
      <>
        <h3 className="mb-3">
          Competitor Screen - <small style={{color: "green"}}>{this.props.teamName}</small>
          <span id="clock">Time left {this.state.timeLeft ? this.state.timeLeft.toFixed(2) : '--.--'} seconds</span>
        </h3>
        <div>
          <Canvas
            setSubmitButton={this.setSubmitButton}
            setTimeLeft={this.setTimeLeft}
            timeLeft={this.state.timeLeft}
            setSubmitModal={this.props.setSubmitModal}
            ref={this.canvasRef}
            teamName={this.props.teamName}
            teamId={this.props.teamId}
          />
          <br/>
          <form>
            <Button
              variant="secondary"
              style={{marginLeft: '60px'}}
              // id="clearButton"
              // canvasRef={this.canvasRef}
              onClick={e => {
                e.preventDefault();
                e.persist();
                (async e => {
                  let { value: confirm } = await Swal.fire({
                    title: 'Clear screen?',
                    text: 'This cannot be undone.',
                    icon: 'warning',
                    showCancelButton: true,
                  });
                  if (!confirm) return ;
                  this.canvasRef.current.clear();
                })(e);
              }}
            >
              Clear
            </Button>
            <Button
              variant="Primary"
              // id="undoButton"
              // canvasRef={this.canvasRef}
              onClick={(e) => this.canvasRef.current.undo(e)}
            >
              Undo
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              disabled={this.state.submitButton.disabled}
              style={{float: 'right', marginRight: '60px'}}
              // canvasRef={this.canvasRef}
              // id="submitButton"
              onClick={e => {
                  e.preventDefault();
                  e.persist();
                  (async e => {
                    let { value: confirm } = await Swal.fire({
                      title: 'Confirm Submission?',
                      text: "You cannot edit after submitted.",
                      icon: 'warning',
                      showCancelButton: true,
                    });
                    if (!confirm) return ;
                    this.canvasRef.current.submit(e);
                  })(e);
                }
              }
            >
              Submit
            </Button>
          </form>
          <br/>
        </div>
      </>
    );
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
          <title>SIMPIC Competitor</title>
          <meta name="description" content=""/>
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0"/>
          <link href="/css/team.css" rel="stylesheet"/>
        </Head>
        <div id="font-example"></div>
        <Main
          teamName={this.props.teamName}
          teamId={this.props.teamId}
        />
      </>
    )
  }
}

App.getInitialProps = async ({pathname, query, asPath, req, res, err}) => {
  return { teamName: query.teamName, teamId: query.teamId };
};  // https://stackoverflow.com/a/57977450/4468834

export default App