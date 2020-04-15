import { Col, Button, Card } from 'react-bootstrap';

class Screen extends React.Component {
  render() {
    const bg = {
      '1': 'lime',
      '-1': 'rgba(253, 16, 0, 0.72)',
      '0': ''
    };
    const color = {
      '1': 'black',
      '-1': 'white',
      '0': 'black'
    };
    return (
      <Col xs="4" className="screen px-2 py-1">
        <Card
          className={this.props.image ? 'sent-box box' : 'box'}
          style={{
            'backgroundColor': bg[this.props.status],
            'color': color[this.props.status]
          }}
        >
          <h3>{this.props.teamName}</h3>
          <img src={this.props.image}/>
        </Card>
      </Col>
    );
  }
}
export default Screen