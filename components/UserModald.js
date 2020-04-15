import { Button, Modal } from 'react-bootstrap';

class UserModal extends React.Component {
  constructor(props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
    this.handleShow = this.handleShow.bind(this);
  }

  handleClose() {
    this.props.set(false);
  }
  handleShow() {
    this.props.set(true);
  }

  render() {
    return (
      <Modal show={this.props.show} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.props.body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={this.props.confirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
};

export default UserModal;