const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

const moment = require('moment');
const chalk = require('chalk');
const winston = require('winston');

const mongoose = require('mongoose');
const Team = require('./models/Team.js');

(async () => {
  await mongoose.connect('mongodb://localhost/simpic-stage', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  await nextApp.prepare();
  
  // var {teams, teamName} = require('./public/js/team');
  let teams = await Team.find({});
  Team.watch().on('change', async data => {
    try {
      let newTeam = await Team.findById(data.fullDocument._id);
      teams[teams.findIndex(e => e.id == newTeam.id)] = newTeam;
    } catch (e) {
      console.log(e);
    }
  });

  /* let teamName = {
    't1': "Team1",
    't2': "Team2",
    't3': "Team3",
    't4': "Team4",
    't5': "Team5",
    't6': "Team6",
    't7': "Team7",
    't8': "Team8",
  }; */

  const app = express();
  var gvar = {};
  const http = require('http').createServer(app);
  const io = require('socket.io')(http);

  // express config, simple route
  app.set('port', +process.env.PORT || 8088);
  app.set('ip', process.env.IP || '0.0.0.0');

  app.get('/', (req, res) => res.send('จิวจิว'));

  app.get('/team/:id', (req, res) => {
    let team = teams[req.params.id - 1];
    nextApp.render(req, res, '/team/team', { teamName: team.name, teamId: team.teamId });
  });

  app.get('/monitor/:round', (req, res) => {
    // console.log(req.query.round)
    nextApp.render(req, res, '/monitor/monitor', { teams, round: req.params.round });
  });

  app.get('/console/:round', (req, res) => {
    let round = req.params.round;
    let defaultTimeLimit = ({
      second: 40,
      final: 60,
    })[round];
    nextApp.render(req, res, '/console', { teams, round, defaultTimeLimit });
  });

  [
    ['/cp', '/control_panel.html'],
    ['/cp6', '/control_panel6.html'],
    ['/mnt', '/mnt.html'],
    ['/mnt6', '/mnt6.html'],
    ['/team', '/team.html'],
    ['/score-sec', '/scoreboard-sec.html'],
    ['/score-fin', '/scoreboard-final.html'],
    ['/console-sec', '/console-sec.html'],
    ['/console-fin', '/console-final.html'],
    ['/judge-sec', '/judge-sec.html'],
    ['/judge-fin', '/judge-fin.html'],
  ]
  .forEach(e => {
    app.get(e[0], function (req, res, next) {
      res.sendFile(__dirname + '/public/html' + e[1]);
    });
  });

  app.get('/teams', (req, res, next) => {
    let teamData = [];
    teams.forEach((e, i) => {
      teamData[i] = {};
      teamData[i].teamId = e.teamId;
      teamData[i].name = e.name;
    });
    res.json(teamData);
  });

  app.get('/log', (req, res, next) => {
    res.sendFile(__dirname + '/jlog/logger.log');
  });

  app.use(express.static('public/vendor/js'));
  app.use(express.static('public/vendor/css'));
  app.get('*', (req, res) => nextApp.getRequestHandler()(req, res));

  // listen
  http.listen(app.get('port'), app.get('ip'), function (err) {
    if (err) throw err;
    console.log(`[${moment().format("MMMM Do YYYY, h:mm:ss a")}]: Node started on ${app.get('ip')}:${app.get('port')} ..
For ${chalk.yellow('CONTROL PANEL')} go to ${chalk.green('HOST:PORT/cp')}
For ${chalk.yellow('MONITOR')} go to ${chalk.green('HOST:PORT/mnt')}
For ${chalk.yellow('CLIENT')} go to ${chalk.green(`HOST:PORT/${chalk.black.bgRed('TEAM')}user`)}

Available ${chalk.black.bgRed('TEAM')}s are ${chalk.yellow('t1')}-${chalk.yellow('t7')} will represent these names :
${chalk.cyan(teams.map(data => data.name))}
editable at xxx.x.x.x:${app.get('port')}/team
---------------------------------------
`);
  });

  // ============ LOGGER ===============
  var tsFormat = function(){
    return (new Date()).toLocaleTimeString();
  }
  var env = 'development';
  let logger = winston.createLogger({
    transports: [
      new (winston.transports.Console)({
        timestamp: tsFormat,
        colorize: true,
        level: 'info'
      }),
      new (winston.transports.File)({
        filename: `jlog/logger.log`,
        timestamp: tsFormat,
        level: env === 'development' ? 'debug' : 'info'
      })
    ]
  });

  // socket.io
  var users = {};
  var usersDraw = {};
  var monIo = io.of('/monitor');
  var clientIo = io.of('/chat');
  var cpIo = io.of('/cp');
  var teamIo = io.of('/team');
  var scoreOutIo = require('socket.io-client')('http://127.0.0.1:8088/score');  // Score Out to Mo's Server
  var imageOutIo = require('socket.io-client')('http://127.0.0.1:8088/image');  // Image Out to Mo's Server
  var serverIo = io.of('/server');
  var monSocket = void 0;

  var islocked = [0,0,0,0,0,0,0,0,0,0];

  var updateMonitor = function updateMonitor(teamId) {
    // console.log(users[teamId]);
    monIo.emit('userChange', {
      img: users[teamId],
      teamId: teamId
    });
  };

  var updateMonitorDraw = function updateMonitorDraw(name) {
    monIo.emit('userDraw', {
      img: usersDraw[name],
      name: name
    });
  };

  var updateMnt = function(img, name){ //unused
    monIO.emit('userChange', {
      img: img,
      name: name,
    })
  }

  // ----- CLIENT -----
  clientIo.on('connection', function (socket) {
    var name = 'Anonymous';
    let teamId = 0;

    socket.emit('connect', true);

    socket.on('name', function (data) {
      name = data.teamName;
      teamId = data.teamId;
      users[name] = '';
      updateMonitor(teamId);
      cpIo.emit('userConnect', {teamId, name: name, time: new Date()});
      logger.info(`Team ${teamId}: ${name} has joined`);
      let timeNow = moment();
      if(gvar.activateTime){
        let diff = gvar.activateTime.diff(timeNow, 'seconds', true);
        if(diff > 0){
          socket.emit('activateDraw', {second: Math.floor(diff)});
        }
      }
    });

    socket.on('imageSend', function (data) {
      users[teamId] = data.img;
      console.log('teamid ' + teamId + ' send to server');
      updateMonitor(teamId); //to monitor
      var dd = new Date();
      cpIo.emit('image', { teamId, name: name, time: dd, timeLeft: data.time });
      clientIo.emit('image', { img: data.img, name: name }); //unused
      if (!islocked[teamId - 1]) imageOutIo.emit('imageSubmit', { img: data.img, name: name, teamId } ); //to server for judge

      logger.info(`${name}: ${teamId} has submitted an answer. Time left ${data.time} s`);
    });

    socket.on('drawing', function (data) {
      //console.log('drawing: (image) emitted by ' + name);
      usersDraw[name] = data;
      updateMonitorDraw(name);
    });

    // --- removing user on "disconnect" ---
    socket.on('disconnect', function () {
      // console.log(name + ' has left');
      logger.info(`${name}: ${teamId} disconnected`);
      cpIo.emit('userDisconnect', {teamId, name: name, time: new Date()});
      if (users[teamId] !== undefined) {
        delete users[teamId];
        updateMonitor(teamId);
      }
    });
  });

  // ----- MONITOR -----

  monIo.on('connection', function (socket) {
    monSocket = socket;
    socket.emit('allUsers', users);
    socket.on('reqNames', function(){
      teamIo.emit('reqNames');
    });
  });

  // ----- CONTROL PANEL -----

  cpIo.on('connection', function (socket) {
    socket.on('activate', function (data) {
      logger.info("Activate drawing for " + data.second + 's');
      data.time = moment();
      if(gvar.activateTime && moment().diff(gvar.activateTime, 'seconds') <= 5){
        console.log(gvar.activateTime);
        return ;
      }
      gvar.activateTime = moment();
      gvar.activateTime.add(data.second, 'seconds');
      clientIo.emit('activateDraw', data);
      cpIo.emit('activateDraw', data);
      for(i=1; i<=8; i++){
        users[i] = '';
        updateMonitor(i);
        imageOutIo.emit('imageSubmit', { img: '', teamId: teams[i-1].teamId, name: teams[i-1].name} ); // to server for judge
      }
      monIo.emit('judge', [0, 0, 0, 0, 0, 0, 0, 0, 0]); // clear judge
      monIo.emit('clear');
      imageOutIo.emit('clearJudge');
    });

    socket.on('judgeMnt', function (data) {
      logger.info('Judge has been made');
      monIo.emit('judge', data);
    });

    socket.on('forceFinish', data=>{
      // console.log('Force finish');
      logger.info('Force finish');
      delete gvar['activateTime'];
      clientIo.emit('forceFinish', true);
      cpIo.emit('forceFinish', true);
    });

    socket.on('clear', function (data) {
      clientIo.emit('clear', data);
    });

    socket.on('lockScreen', data => {
      monIo.emit('lockScreen', data);
      // console.log('Lock screen of '+ chalk.yellow(data.name));
      logger.info(`Lock screen of team ${data.index}: ${teams[data.index].name}`);
      islocked[data.index]=data.value;
    });

    socket.on('unscoreMo', () => {
      logger.info('Unscore sent');
      scoreOutIo.emit('unscoreSecond', {});
    });
    socket.on('scoreMo', data => {
      logger.info('Score sent, ' + JSON.stringify(data.slice(1, 9)));
      scoreOutIo.emit('scoreSecond', data);
    });
    socket.on('scoreFinal', data => {
      logger.info('Score sent' + JSON.stringify(data.slice(1, 7)));
      scoreOutIo.emit('scoreFinal', data);
    });
    socket.on('reqNames', function(){
      // logger.info('cp req names');
      teamIo.emit('reqNames');
    });
  });
  //-----------------------------------------------
  teamIo.on('connection',function(socket){
    socket.on('names',function(data){
      logger.info('Names have been sent');
      /* for(var i=1; i<=8; i++){
        teamName['t'+i]=data['t'+i];
      } */
      // if(data['sub']==1)
      //   clientIo.emit('changeNames',data);
      cpIo.emit('changeNames',data);
      monIo.emit('changeNames',data);
      scoreOutIo.emit('teamsObj',data);
    });
  });

  //--------------- server to dashboard ------------
  serverIo.on('connection',function(socket){

    socket.on('sendResult', function(data){
      logger.info('judge recieved, ' + JSON.stringify(data.slice(1, 9)) + '(1 = correct), ' + (+data[9] ? 'Unsent' : 'Sent'));
      cpIo.emit('sendResult', data);
    });
    socket.on('sendResultFinal', function(data){
      cpIo.emit('sendResultFinal', data);
    });
    socket.on('judgeMnt', function (data) {
      logger.info('Clear judge');
      monIo.emit('judge', data);
    });

    socket.on('reqImage', function(){
      imgs = []
      for(var i=1; i<=4; i++){
        imgs.push(users['t'+i]);
      }
      imageOutIo.emit('imageSaved',imgs);
    });
    socket.on('sendSaved',function(data){
      for(i=1; i<=4; i++){
        users['t'+i] = data[i-1];
        updateMonitor('t'+i); //to monitor
      }
      logger.info('Saved images have been used');
    });

    socket.on('reqNames', function(){
      teamIo.emit('reqNames');
    });
  });

  var jsocket=io.of('/score');
  var isocket=io.of('/image');
  var dashIo = require('socket.io-client')('http://127.0.0.1:8088/server');
  var isElim=[];
  var score=[];
  var score2=[];
  var scorefin=[0];
  var judgesecond=[]; //clicking count
  var judgefinal=[];
  for(var k=0;k<=8;k++) {score[k]=0;isElim[k]=0;} //second round
  for(var k=0;k<=5;k++) score2[k]=0.00;
  for(var k=1;k<=6;k++) scorefin[k]=0.00; //final round
  for(var k=1;k<=9;k++) judgesecond[k]=0;
  for(var k=0;k<=6;k++) judgefinal[k]=0;
  io.on('connection', function(socket){
    // console.log('a user connected');

    socket.on('update', function(data){
      score[0]=data[0];
      for(var i = 1; i <= 8; i++){
        if(isElim[i]==0)
          score[i]+=data[i];
      }
      io.emit('score',score);
      console.log('working');
    });
    socket.on('clear', function(){
      for(var i=0;i<=8;i++) score[i]=0;
      io.emit('cleared',score);
      monIo.emit('clear', {});
    });
    socket.on('ranked', function(data){
      // console.log('updating');
      io.emit('updRanked',data);
    });
    socket.on('elim',function(i){
      isElim[i]=1;
      io.emit('eliminated',i);
    });
    socket.on('unelim',function(i){
      isElim[i]=0;
      io.emit('uneliminated',i);
    });

    socket.on('semi', function(i,data){
      score2[i]+=data;
      io.emit('result',i,score2[i]);
    });

    socket.on('clear2', function(){
      for(var i=0;i<6;i++) score2[i]=0;
        io.emit('cleared2',1);
    });

    socket.on('clearfin', function(){
      for(var i=1;i<5;i++) scorefin[i]=0;
        io.emit('clearedfin',scorefin);
    }); 
    socket.on('judgesemi', function(data){
      io.emit('judgesemi2',data);
    });
    socket.on('judgesec', function(i){
      judgesecond[i]++;
      if(i==0){ //clear
        for(var j=0;j<=9;j++){
          judgesecond[j]=0;
          io.emit('judgesec2',j,judgesecond[j]);
        }
      }
      io.emit('judgesec2',i,judgesecond[i]);
    });
    socket.on('judgefin', function(i){
      if (i >= 0) judgefinal[i]++;
      else {
        for(var j=0;j<=6;j++){
          judgefinal[j]=0;
          io.emit('judgefin2',j,judgefinal[j]);
        }
      }
      io.emit('judgefin2',i,judgefinal[i]);
    });
    
    socket.on('sendfin',function(data){
      console.log(1);
      scorefin[0]+=1;
      for(var i=1;i<5;i++){
            if(data[i]==-1) scorefin[i]=scorefin[i]*4/5;
            if(data[i]==1) scorefin[i]+=10;
          }
      io.emit('scorefin',scorefin);
    });
    socket.on('scorefinOverride',function(data){
      for(var i=1;i<5;i++){
          scorefin[i]=data[i];
      }
      io.emit('scorefin',scorefin);
    })

    socket.on('reqImage',function(){
      dashIo.emit('reqImage');
      //console.log('requesting images');
    });
    socket.on('sendSaved',function(data){
      dashIo.emit('sendSaved',data);
      for(var i=1; i<=6; i++){
        io.emit('imageForJudge',{teamId: i, name:"t"+i,img: data[i-1]});
      }
    });

    socket.on('sendResult',function(data){
      dashIo.emit('sendResult',data);
    });
    socket.on('sendResultFinal',function(data){
      dashIo.emit('sendResultFinal',data);
    });
    socket.on('judgeMnt',function(data){
      dashIo.emit('judgeMnt',data);
    });
    
    socket.on('reqNames',function(){
      dashIo.emit('reqNames');
    });
  });

  isocket.on('connection',function(socket){
    socket.on('clearJudge',function(){
      for(var j=0;j<=9;j++){
        judgesecond[j]=0;
        io.emit('judgesec2',j,judgesecond[j]);
      }
      for(var j=0;j<=6;j++){
        judgefinal[j]=0;
        io.emit('judgefin2',j,judgefinal[j]);
      }
    });
    socket.on('imageSubmit',function(data){
      //console.log('Image has been received');
      io.emit('imageForJudge',data);
    });
    socket.on('imageSaved',function(data){
      io.emit('imageSaved',data);
      //console.log('received images');
    });
  });

  jsocket.on('connection',function(socket){
    socket.on('scoreFinal',function(data){
      // console.log(data);
      scorefin[0]+=1;
      for(var i=1;i<=6;i++){
        if(data[i]==-1) scorefin[i]=scorefin[i]*4/5;
        if(data[i]==1) scorefin[i]+=10;
      }
      console.log(scorefin);
      io.emit('scorefin', scorefin);
    });

    let last;

    socket.on('unscoreSecond', () => {
      if (!last) return console.log('no scoring yet, cant unscore');
      let data = last;
      for(var i=0;i<=8;i++){
        if(!isElim[i])
          score[i] -= data[i];
      }
      io.emit('score',score);
      // console.log('working');
    });

    socket.on('scoreSecond', function(data){
      for(var i=0;i<=8;i++){
        if(!isElim[i])
          score[i] += data[i];
      }
      last = data;
      io.emit('score',score);
      // console.log('working');
    });

    socket.on('teamsObj',function(data){
      io.emit('changeTeams',data);
    });
  });
})().catch(e => console.log(e));