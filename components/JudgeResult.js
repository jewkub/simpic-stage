import React from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';

class JudgeResult extends React.Component {
  render() {
    let arr = [];
    this.props.teams.forEach((team, i) => {
      arr.push(
        <Row key={i}>
          <h4>{team.teamId}: {team.name}  <span className="tag is-info timeleft-tag" style={{display: 'none'}}></span></h4>
          <label class="radio">
            <input type="radio" name={team.teamId} value="correct"/>
            Correct
          </label>
          <label class="radio">
            <input type="radio" name={team.teamId} value="wrong"/>
            Wrong
          </label>
          <label class="radio">
            <input type="radio" name={team.teamId} value="notAnswer"/>
            Not Answer
          </label>
          <input
            type="text"
            className="text-score"
            placeholder="0.00"
            value={this.props.score}
            onChange={e => {
              this.props.scoreChange(+e.target.value, i);
            }}
          />
        </Row>
      );
    });
    return arr;
  }
}
export default JudgeResult