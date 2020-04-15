'use strict';

document.addEventListener('touchmove', function (event) {
  if (event.scale !== 1) { event.preventDefault(); }
}, false);


var UserName = window.location.pathname.substr(1, window.location.pathname.length-5); //t1
var timeGiven;
var startTime;
var stopTime;

// alert(window.devicePixelRatio);
var canvas;
var update = picker => {
  canvas.freeDrawingBrush.color = '#' + picker;
};

var turnDrawOff = function(){
  if(canvas.isDrawingMode == true){
    stopTime = moment();
    var timeDiff = (timeGiven-stopTime.diff(startTime, 'seconds', true));
    if(timeDiff<0.00)
      timeDiff="0.00";
    else
      timeDiff=timeDiff.toFixed(2);
    console.log("Time diff: " + timeDiff);
    window.timeDiff = timeDiff;
    canvas.isDrawingMode = false;
    canvas.backgroundColor = '#ddd';
    canvas.renderAll();
    $('#submitButton').addClass('disabled');
  }
}

var canvasControl = function(canvas, value){
  if (value <= 0) return turnDrawOff();

  canvas.isDrawingMode = true;
  //canvas.backgroundColor = '#FF0000';
  canvas.renderAll();
  startTime = moment();
  var timeLeft = value;
  timeGiven = value;
  $('#submitButton').removeClass('disabled');
  // for(let It = 1; It <= 99999 ; It ++) clearInterval(It);
  window.countdown = setInterval(function(){
    timeLeft = value - moment().diff(startTime)/1000;
    window.timeDiff = timeLeft;
    $("#time-left").html(timeLeft.toFixed(2));
    if(timeLeft <= 0.0){
      if(canvas.isDrawingMode){
        if(value - moment().diff(startTime) >= 2) alert('contact staff'); // ?

        turnDrawOff();
        canvas.backgroundColor = null;
        socket.emit('imageSend', {img: canvas.toDataURL(), time: 0.0});
        $('#submitModal').modal('hide');
        //socket.emit('drawing', canvas.toDataURL());
        canvas.backgroundColor = '#DDDDDD';
        canvas.renderAll();
      }
      $("#time-left").html('0.00');
      clearInterval(window.countdown);
    }
  }, 10);
  socket.emit('drawing', canvas.toDataURL());
}

function clearBoard(){
  canvas.clear();
  canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
  canvas.renderAll();
  //socket.emit('drawing', canvas.toDataURL());
}

var eraserMode = false;
var name;
var socket = io('/chat');

$('#yourname').html("("+teamName[UserName]+")");
$(() => {
	if(teams.filter(t=>{return t.name == UserName;}).length == 0){
		alert('This username is not in the team list');
	}
  $('canvas').attr('width', 1976 / window.devicePixelRatio);
  $('canvas').attr('height', 1332 / window.devicePixelRatio);
  canvas = new fabric.Canvas('c', {
    backgroundColor: '#ddd'
  });
  canvas.renderAll();
  // console.log(canvas);
  canvas.isDrawingMode = false;
  canvas.selection = false;
  canvas.freeDrawingBrush.width = 8;

  $('#sizeInput').on('input', event => {
    canvas.freeDrawingBrush.width = parseInt($('#sizeInput').val());
  });
  canvas.on('mouse:up', option => {
    if (canvas.size()) {
      canvas.item(canvas.size() - 1).set("perPixelTargetFind", true);
      canvas.item(canvas.size() - 1).set("selectable", false);
    }
    if(canvas.isDrawingMode == true){
       //socket.emit('drawing', canvas.toDataURL());
    }
  });
  canvas.on('mouse:over', function (e) {
    if (eraserMode == true) {
      canvas.remove(e.target);
      socket.emit('drawing', canvas.toDataURL());
    }
  });

  $('#clearConfirm').click(event => {
    if(canvas.isDrawingMode == true){
        clearBoard();
    }
		// event.target.blur();
  });

  $('#submitConfirm').click(event => {
    event.preventDefault();
    if(canvas.isDrawingMode == false){
      return;
    }
    turnDrawOff();
    let tDiff = window.timeDiff;
    canvas.backgroundColor = null;
    socket.emit('imageSend', {img: canvas.toDataURL(), time: tDiff});
    clearInterval(window.countdown);
    document.getElementById('time-left').innerHTML = tDiff;
    window.handSubmitted = true;
    //socket.emit('drawing', canvas.toDataURL());
    canvas.backgroundColor = '#DDDDDD';
    canvas.renderAll();
  });

  $("#undoButton").click(function (e) {
		e.target.blur();
    if(canvas.isDrawingMode == false) return;
    canvas.remove(canvas.item(canvas.size() - 1));
    //socket.emit('drawing', canvas.toDataURL());
  });

  $('#submitButton').click(e=>{
		e.target.blur();
    if(canvas.isDrawingMode)
      $('#submitModal').modal('toggle');
  });

  $('#clearButton').click(e=>{
		e.target.blur();
    if(canvas.isDrawingMode)
      $('#clearModal').modal('toggle');
  });


  // ----- socket -----
  socket.on('image', data => {
    // update chat list -----
  });

  socket.on('connect',function() {
    console.log('Client has connected to the server!');
    socket.emit('name', {name: UserName});
  });

  socket.on('clear', () => {
    clearBoard();
    $('#time-left').text('--.--');
  });

  socket.on('activateDraw', data => {
    window.handSubmitted = false;
    clearBoard();
    canvasControl(canvas, data.second);
  });

  socket.on('forceFinish', data => {
    clearInterval(window.countdown);
		if (!canvas.isDrawingMode) return;
    document.getElementById('time-left').innerHTML = window.timeDiff.toFixed(2);
    socket.emit('imageSend', {img: canvas.toDataURL(), time: window.timeDiff});
    turnDrawOff();
    //socket.emit('drawing', canvas.toDataURL());
  });
  // socket.on('changeNames',function(data){
  //   $('#yourname').html("("+data[UserName]+")");
  // });
});
