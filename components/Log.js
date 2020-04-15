import React from 'react';
import { Col, Button, Card } from 'react-bootstrap';

class Log extends React.Component {
  render() {
    return (
      <ul>
        {this.props.log.map((e, i) => React.cloneElement(e, { key: i })).reverse()}
      </ul>
    );
  }
}
export default Log