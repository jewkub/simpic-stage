const mongoose = require('mongoose');
const Team = require('../models/Team.js');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost/simpic-stage', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const teams = [];
    for (let i = 1; i <= 8; i++) {
      let team = new Team();
      team.teamId = i;
      team.name = 'Team ' + i;
      team.score = 0;
      await team.save();
      teams.push(team);
    }
    await mongoose.disconnect();
  } catch (e) {
    console.log(e);
  }
})();