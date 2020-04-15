var cropImage = function() {
  var ctx = canvas.getContext('2d');
  var w = canvas.width,
    h = canvas.height,
    pix = {x:[], y:[]},
    imageData = ctx.getImageData(0,0,canvas.width,canvas.height),
    x, y, index;

  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      index = (y * w + x) * 4;
      if (imageData.data[index+3] > 0) {

        pix.x.push(x);
        pix.y.push(y);

      }
    }
  }
  pix.x.sort(function(a,b){return a-b});
  pix.y.sort(function(a,b){return a-b});
  var n = pix.x.length-1;

  w = pix.x[n] - pix.x[0];
  h = pix.y[n] - pix.y[0];
  //var cut = ctx.getImageData(pix.x[0], pix.y[0], w, h);

  console.log(pix.x[0], pix.y[0], w, h);

  socket.emit('imageSend', {
    img: canvas.toDataURL({
      left: pix.x[0],
      top: pix.y[0],
      width: w,
      height: h,
    }),
    time: window.timeDiff
  });


  //canvas.width = w;
  //canvas.height = h;
  //ctx.putImageData(cut, 0, 0);

  //var image = canvas.toDataURL();
  //var win=window.open(image, '_blank');
  //win.focus();
}


var lockedScreen = [false,false,false,false,false,false,false,false];
window.disableDraw = false;

/* teams.forEach((team, index) => {
  let name = team.name;
  if(teamName[name]) name = teamName[name];
  $(`.screen:eq(${index}) > div > h3`).text(name);
  team.index = index;
}); */
let teams = [];

$.get('/teams', x => {
  teams = x;
  // console.log(teams);
  teams.forEach(e => {
    $(`.screen:eq(${e.teamId-1}) > div > h3`).text(e.name);
  });

  var socket = io('/monitor');

  socket.emit('reqNames');

  socket.on('userChange', data => {
    console.log(data);
    let teamId = teams.find(t => t.teamId == data.teamId).teamId;
    teamId--;
    if (data.img && !lockedScreen[teamId]){
      $(`.screen:eq(${teamId}) > div > img`).attr('src', data.img);
      $(`.screen:eq(${teamId}) > .box`).addClass('sent-box');
    }
  });
  //window.disableDraw = true;
  /* socket.on('userDraw', data => {
    //if(window.disableDraw && window.disableDraw == true) return;
    let team = teams.find(t => t.name == data.name);
    if(team && data.img && !lockedScreen[team.index]){
      $(`.screen:eq(${team.index}) > div > img`).attr('src', data.img);
      $(`.screen:eq(${team.index}) > .box`).removeClass('sent-box');
    }
  }); */

  socket.on('allUsers', data => {
    teams.forEach((team, index) => {
      if(data.hasOwnProperty(team.name)){
        $(`.screen:eq(${index}) > div > img`).attr('src', data[team.name]);
        //console.log('data', getCrop(data[team.name]));
      }
    });
  });

  socket.on('clear', data => {
    $('img').removeAttr('src');
  });

  socket.on('judge', data => {
    for (let i in data) {
      if (data[i] == 1) $(`.screen:eq(${i-1}) > div`).css('background', 'lime').css('color', 'black');
      else if (data[i] == -1) $(`.screen:eq(${i-1}) > div`).css('background', 'rgba(253, 16, 0, 0.72)').css('color', 'white');
      else if (data[i] == 0) $(`.screen:eq(${i-1}) > div`).css('background', '').css('color', 'black');
    }
    /* teams.forEach((team, index) => {
      if(data.hasOwnProperty(team.name)){
        if(data[team.teamId] == 1)
          $(`.screen:eq(${index}) > div`).css('background', 'lime').css('color', 'black');
          // $(`.screen:eq(${index}) > div`).css('background', '#B5E045').css('color', 'black').css('filter','invert(1)');
          // $(`.screen:eq(${index}) > div`).css('background', 'lime').css('color', 'black').css('filter','invert(1)');
        if(data[team.teamId] == -1)
          $(`.screen:eq(${index}) > div`).css('background', 'rgba(253, 16, 0, 0.72)').css('color', 'white');
          // $(`.screen:eq(${index}) > div`).css('background', '#ff7e6f').css('color', 'black').css('filter','invert(1)');
          // $(`.screen:eq(${index}) > div`).css('background', 'rgba(253, 16, 0, 0.72)').css('color', 'black').css('filter','invert(1)');
        if(data[team.teamId] == 0)
          $(`.screen:eq(${index}) > div`).css('background', '').css('color', 'black');
          // $(`.screen:eq(${index}) > div`).css('background', '#DDDDDD').css('color', 'black').css('filter','invert(0)');
      }
    }); */
  });

  socket.on('lockScreen', data => {
    lockedScreen[data.index] = data.value;
  });

  socket.on('changeNames',function(data){
    for(var i=1; i<=8; i++){
      $(`.screen:eq(${i-1}) > div > h3`).text(data['t'+i]);
    }
    console.log("Name has been changed");
  });

  var createImage = function (src) {
    var deferred = $.Deferred();
    var img = new Image();

    img.onload = function() {
      deferred.resolve(img);
    };
    img.src = src;
    return deferred.promise();
  };
});

/*
 * Create an Image, when loaded pass it on to the resizer
 */
var startResize = function () {
  $.when(
    createImage($("#inputImage").attr('src'))
  ).then(resize, function () {console.log('error')});
};

/*
 * Draw the image object on a new canvas and half the size of the canvas
 * until the darget size has been reached
 * Afterwards put the base64 data into the target image
 */
var resize = function (image) {
  mainCanvas = document.createElement("canvas");
  mainCanvas.width = 1024;
  mainCanvas.height = 768;
  var ctx = mainCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0, mainCanvas.width, mainCanvas.height);
  //$('#outputImage').attr('src', mainCanvas.toDataURL("image/jpeg"));
  return 'yes';
};
