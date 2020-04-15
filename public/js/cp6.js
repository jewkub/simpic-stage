var islocked = [0,0,0,0,0,0,0,0,0,0];
let timeCount = 60;

let teams = [];

$.get('/teams', data => {
  teams = data;
  teams.forEach(e => {
    $(`.screen:eq(${e.teamId-1}) > div > h3`).text(e.name);
  });

  // ------ create scorer ------
  teams.forEach((team, index) => {
    let checker = `
    <div class="control has-text-centered "${index>5?'hidden':''}>
    <h4 class="has-text-weight-bold"><span id="${team.teamId}name">${team.teamId}: ${team.name}</span>  <span class="tag is-info timeleft-tag" id='tag-item-${team.teamId}' style="display:none"></span></h4>
    <label class="radio">
      <input type="radio" name="${team.teamId}" value="correct">
      Correct
    </label>
    <label class="radio">
      <input type="radio" name="${team.teamId}" value="wrong">
      Wrong
    </label>
    <label class="radio">
      <input type="radio" name="${team.teamId}" value="notAnswer">
      Not Answer
    </label>
  </div><br/>`
    $('.score > div').append(checker);
  });
});

var getScoreFromTime = function(time){
  return 10+2*Math.floor(time/10);
}

function filterLogs(filter) {
  $("#filter-button-user").text("USER");
  switch (filter) {
    case 'ALL':
      $('ul > li').show();
      return;
    case 'ACTIVATE':
      $('ul > li').hide();
      $(`ul > li[data-tags="activate"]`).show();
      return;
    case 'CONNECT':
      $('ul > li').hide();
      $(`ul > li[data-tags="connect"]`).show();
      $(`ul > li[data-tags="disconnect"]`).show();
      return;
    case 'SUBMIT':
      $('ul > li').hide();
      $(`ul > li[data-tags="submit"]`).show();
      return;
    case 'USER':
      let user = prompt("Username");
      if (!user) {
        $('#filter-button-all').click();
        return;
      }
      $('ul > li').hide();
      $('ul > li').each(function () {
        if ($(this).text().indexOf(`${user}`) !== -1) {
          $(this).show();
        }
      });
      return;
    case 'CLICKED_USER':
      $('ul > li').hide();
      $('ul > li').each(function () {
        if ($(this).text().indexOf(`${window.clickedUser}`) !== -1) {
          $(this).show();
        }
      });
      return;
  }

}

function getUserLog(teamId) {
  return `<span class="tag is-primary">${teamId}: ${teams[teamId-1].name}</span>`;
}

$('#filter-button > p > a.button')
  .click(function () {
    $('#filter-button > p > a.is-link').removeClass('is-link');
    $(this).addClass('is-link');
    filterLogs($(this).text().trim());
  });

function getLogTime(date) {
  let time = `${ ('0' + date.getHours()).slice(-2)}:${ ('0' + date.getMinutes()).slice(-2)}:${ ('0' + date.getSeconds()).slice(-2)}`;
  time = time + ':' + ('00' + date.getMilliseconds()).slice(-3);
  time = `<span class="tag is-black" style="margin-right: 30px;">${time}</span>`;
  return time;
}

var countDown = function(second) {
  var timeLeft = second;
  timeLeft-=0.1;
  $("#time-left").html(timeLeft.toFixed(2));
  window.countdown = setInterval(function () {
    timeLeft-=0.1;
    $("#time-left").html(timeLeft.toFixed(2));
    if (timeLeft <= 0.0) {
      $("#time-left").html('--.--');
      clearInterval(window.countdown);
    }
  }, 100);
}

$(function () {
  $('#second').val(timeCount);

  var socket = io('/cp');
  socket.emit('reqNames');
  document
    .getElementById('clear-log')
    .addEventListener('click', function () {
      document
        .getElementById('log-cp')
        .innerHTML = '';
      document
        .querySelectorAll('.timeleft-tag')
        .forEach(data => {
          data.innerText = '';
          data.style.display = 'none';
        });
    });

  $("#activateDraw").click(function (e) {
    second = +$('#second').val();
    if (!second)
      return;
    name = 'control panel'
    if($("#time-left").text()!="--.--"){
      alert('Please force finish before activate new session');
      return;
    }
    else {
      socket.emit('activate', {second, name});
      $('#second').val(timeCount);
    }
    e.preventDefault();
  });


  document
    .getElementById('force-finish')
    .addEventListener('click', e => {
      console.log('force Finish');
      socket.emit('forceFinish', true);
    });

  socket.on('activateDraw', data => {
    data.time = new Date(data.time);
    let logTime = getLogTime(data.time);
    $("#log-cp").prepend(`<li data-tags='activate'>${logTime} Activate for <span class="tag is-success">${second}</span> second(s)</li>`);
    for(var i=1; i<=8; i++){
      $('#text-t'+i).val('0.00');
      document.querySelector('input[type="radio"][name*="'+i+'"][value="correct"]').checked = false;
      document.querySelector('input[type="radio"][name*="'+i+'"][value="wrong"]').checked = false;
      document.querySelector('input[type="radio"][name*="'+i+'"][value="notAnswer"]').checked = false;
    } 
  });

  socket.on('image', data => {
    data.time = new Date(data.time);
    let submittedTime = getLogTime(data.time);
    $("#log-cp").prepend(`<li data-tags='submit'>${submittedTime} ${getUserLog(data.teamId)} submitted, time left ${data.timeLeft}</li>`);
    let tmp = document.getElementById('tag-item-' + data.teamId);
    if(tmp){
      tmp.style.display = '';
      tmp.innerText = data.timeLeft;
    }
    if(data.timeLeft==0.00){
      // $('#text-'+data.name).val(0);
      document.querySelector('input[type="radio"][name*="'+i+'"][value="notAnswer"]').checked = true;
    }
    // else 
    //   $('#text-'+data.name).val(1);
  });

  socket.on('userConnect', data => {
    data.time = new Date(data.time);
    console.log(data.teamId);
    let submittedTime = getLogTime(data.time);
    $("#log-cp").prepend(`<li data-tags='connect'>${submittedTime} ${getUserLog(data.teamId)} <span class='tag is-success'>Connected</span></li>`);
  });

  socket.on('userDisconnect', data => {
    data.time = new Date(data.time);
    let submittedTime = getLogTime(data.time);
    $("#log-cp").prepend(`<li data-tags='disconnect'>${submittedTime} ${getUserLog(data.teamId)} <span class='tag is-danger'>Disconnected</span></li>`);
  });

  socket.on('activateDraw', data => {
    countDown(data.second);
  });

  socket.on('forceFinish', data => {
    clearInterval(window.countdown);
    document.getElementById('time-left').innerText = "--.--";
  });

  socket.on('sendResultFinal', data => {
    console.log(data);
    for(var i=1;i<=6;i++){
      if(data[i] == 1){
        document.querySelector('input[type="radio"][name*="'+i+'"][value="correct"]').checked = true;
        //$('#text-t'+i).val(1);
      }
      if(data[i] == 2){
        document.querySelector('input[type="radio"][name*="'+i+'"][value="wrong"]').checked = true;
        //$('#text-t'+i).val(-1);
      }
      if(data[i] == 0){
        document.querySelector('input[type="radio"][name*="'+i+'"][value="notAnswer"]').checked = true;
        //$('#text-t'+i).val(0);
      }
    }
  });

  socket.on('changeNames',function(data){
    for(var i=1; i<=6; i++){
      teamName['t'+i]=data['t'+i];
      document.getElementById('t'+i+'name').innerText = 't' + i + ': '+ data['t'+i];
    }
  });
  
//------------------------------------------------------------------------------------------------------------

  $('#judge-score-button').click(function () {
    if (confirm('Do you want to judge?')) {
      let score = {};
      teams.forEach((team, index) => {
        let correct = $(`input[name='${team.teamId}'][value="correct"]`);
        let wrong = $(`input[name='${team.teamId}'][value="wrong"]`);
        if (correct.is(':checked'))
          score[team.teamId] = 1;
        else if (wrong.is(':checked'))
          score[team.teamId] = -1;
        else
          score[team.teamId] = 0;
        }
      );
      // console.log(score);
      socket.emit('judgeMnt', score);
      //$('input[type="radio"]').prop("checked", false);
    }
  });
  $('#emit-score-button').click(function(){
    if(confirm('Do you want to score?')) {
      var arr = [1];
      teams.forEach((team, index) => {
        let correct = $(`input[name='${team.teamId}'][value="correct"]`);
        let wrong = $(`input[name='${team.teamId}'][value="wrong"]`);
        if (correct.is(':checked'))
          arr.push(1);
        else if (wrong.is(':checked'))
          arr.push(-1);
        else
          arr.push(0);
        }
      );
      console.log(arr)
      socket.emit('scoreFinal', arr);
    }
  });

  $("body").on('click', "span.is-primary", function () {
      window.clickedUser = $(this).text();
      $('#filter-button > p > a.is-link').removeClass('is-link');
      $('#filter-button-user').addClass('is-link');
      filterLogs('CLICKED_USER');
  });

  document.querySelectorAll('h4').forEach((el, index) => {
    let lockedColor = 'red';
    el.addEventListener('click', (e) => {
      if(el.style.color != lockedColor){
        if(confirm(`lock ${el.innerText.split(' ')[0]} screen?`)){
          islocked[index+1]=1;
          el.style.color = lockedColor;
          socket.emit('lockScreen', {name: `t${index+1}`, index: index, value: true});
        }
      } else {
        if(confirm(`unlock ${el.innerText.split(' ')[0]} screen?`)){
          islocked[index+1]=0;
          el.style.color = 'black';
          socket.emit('lockScreen', {name: `t${index+1}`, index: index, value: false});
        }
      }
    });
  });
  $(document).ready(function(){
    $('#clear-button').click(function(){
      if(window.confirm('Are you sure you want to clear all score?')){
        document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
        $('input[type*="radio"]').attr('checked', false);
        // for(var i=1;i<=4;i++){
        //   $('#text-t'+i).val("0.00");
        // }
        socket.emit('judgeMnt', {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0});
      }
    });
  });
});
