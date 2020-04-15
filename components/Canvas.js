import React, { useState } from 'react';
import { fabric } from 'fabric'; // https://stackoverflow.com/a/39593974/4468834
import * as moment from 'moment';
import io from 'socket.io-client';

class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.clear = this.clear.bind(this);
    this.undo = this.undo.bind(this);
    this.submit = this.submit.bind(this);
    this.socket = io('/chat');
    // console.log(this.socket);
    this.state = {
      dpr: 1
    };
  }
  componentDidMount() {
    this.setState({
      dpr: window.devicePixelRatio
    });

    // Here we have the canvas so we can initialize fabric
    this.canvas = new fabric.Canvas(this.canvasRef.current, {
      backgroundColor: '#ddd',
      width: 1976 / window.devicePixelRatio,
      height: 1332 / window.devicePixelRatio,
      selection: false,
    });
    this.canvas.freeDrawingBrush.width = 8;
    window.canvas = this.canvas;
    this.canvas.on('mouse:up', option => {
      if (this.canvas.size()) {
        this.canvas.item(this.canvas.size() - 1).set("perPixelTargetFind", true);
        this.canvas.item(this.canvas.size() - 1).set("selectable", false);
      }
      if (this.canvas.isDrawingMode){
         //socket.emit('drawing', canvas.toDataURL());
      }
    });
    this.canvas.on('mouse:over', function (e) {
      if (this.eraserMode) {
        this.canvas.remove(e.target);
        // socket.emit('drawing', canvas.toDataURL());
      }
    });

    // socket
    this.socket.on('image', data => {
      // update chat list -----
    });
  
    this.socket.on('connect', () => {
      console.log('Client has connected to the server!');
      this.socket.emit('name', {teamName: this.props.teamName, teamId: this.props.teamId});
    });
  
    this.socket.on('clear', () => {
      this.clearBoard();
      // $('#time-left').text('--.--');
    });
  
    this.socket.on('activateDraw', data => {
      this.handSubmitted = false;
      this.clearBoard();
      this.canvasControl(data.second);
    });
  
    this.socket.on('forceFinish', data => {
      // unfinished
      if (!this.canvas.isDrawingMode) return;
      this.turnDrawOff();
      this.socket.emit('imageSend', {img: this.canvas.toDataURL(), time: this.props.timeLeft});
      //socket.emit('drawing', canvas.toDataURL());
    });
    // socket.on('changeNames',function(data){
    //   $('#yourname').html("("+data[UserName]+")");
    // });
  }

  clearBoard() {
    this.canvas.clear();
    this.canvas.setBackgroundColor(null, this.canvas.renderAll.bind(this.canvas));
    this.canvas.renderAll();
    //socket.emit('drawing', canvas.toDataURL());
  }

  clear() {
    if (this.canvas.isDrawingMode) {
      this.clearBoard();
    }
  }

  submit(event) {
    event.preventDefault();
    if (!this.canvas.isDrawingMode) return;

    this.turnDrawOff();
    this.canvas.backgroundColor = null;
    this.socket.emit('imageSend', { img: this.canvas.toDataURL(), time: this.props.timeLeft });
    this.handSubmitted = true;
    //socket.emit('drawing', canvas.toDataURL());
    this.canvas.backgroundColor = '#DDDDDD';
    this.canvas.renderAll();
  }

  undo(event) {
		event.target.blur();
    if (!this.canvas.isDrawingMode) return;
    this.canvas.remove(this.canvas.item(this.canvas.size() - 1));
    //socket.emit('drawing', canvas.toDataURL());
  }

  updateColor(picker) {
    this.canvas.freeDrawingBrush.color = '#' + picker;
  }

  canvasControl(timeLimit) {
    if (timeLimit <= 0) return this.turnDrawOff();

    this.timeLimit = timeLimit;
    this.canvas.isDrawingMode = true;
    this.canvas.renderAll();
    this.startTime = moment();
    // console.log(timeLimit);
    this.props.setTimeLeft(timeLimit);
    this.props.setSubmitButton({ disabled: false });

    this.countdown = setInterval(() => {
      let timeLeft = timeLimit - moment().diff(this.startTime)/1000;
      this.props.setTimeLeft(timeLeft);
      if (timeLeft > 0 || !this.canvas.isDrawingMode) return ;

      this.turnDrawOff();
      this.canvas.backgroundColor = null;
      this.socket.emit('imageSend', { img: this.canvas.toDataURL(), time: 0 });
      // this.props.setSubmitModal(false);
      //socket.emit('drawing', canvas.toDataURL());
      this.canvas.backgroundColor = '#DDDDDD';
      this.canvas.renderAll();
      clearInterval(this.countdown);
    }, 10);
  }

  turnDrawOff() {
    if (!this.canvas.isDrawingMode) return ;

    clearInterval(this.countdown);
    console.log("Time diff: " + this.props.timeLeft);
    this.canvas.isDrawingMode = false;
    this.canvas.backgroundColor = '#ddd';
    this.canvas.renderAll();
    this.props.setSubmitButton({ disabled: true });
  }

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        style={{border: '1px solid #c3c3c3'}}
      >
        Your browser does not support the canvas element.
      </canvas>
    );
  }
}
export default Canvas;