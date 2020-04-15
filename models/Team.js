const mongoose = require('mongoose');

const Team = mongoose.model('Team', new mongoose.Schema({
  teamId: { type: Number },
  name: { type: String },
  score: { type: Number },
}));

module.exports = Team;
// export default Team;