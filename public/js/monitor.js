var globalScreen = {};
var globalReact = {};

class Screen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      name: this.props.name,
      image: this.props.img,
      verdict: 0
    }
    globalScreen[this.props.name] = {};
    globalScreen[this.props.name].updateImage = (data) => {
      this.setState({image: data})
    }
    globalScreen[this.props.name].updateVerdict = (data) => {
      this.setState({verdict: data})
    }
  }
  render() {
    var vd = '';
    if(this.state.verdict > 0) vd = 'bg-green';
    if(this.state.verdict < 0) vd = 'bg-red';
    return (
      <div className="column is-3">
        <div className="box">
          <p className={"has-text-centered is-size-5 "+vd}>
            <strong style={vd!=''?{color:'white'}:{}}>{this.state.name}</strong>
          </p>
          <br/>
          <img src={this.state.image}/>
        </div>
      </div>
    );
  }
}

class ScreenInput extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit() {
    this.props.addScreen(this.state.value);
    this.setState({value: ''});
  }

  render() {
    return (
      <div className='form column is-11'>
        <input type="text" value={this.state.value} onChange={this.handleChange} className="input" />
        <a className='button' onClick={this.handleSubmit}>Submit</a>
      </div>
    );
  }
}

class FullScreen extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      users: [{
        name: 'hello',
        img: ''
      }, {
        name: 'Hi',
        img: ''
      }]
    }
    globalReact.addScreen = (data) =>{
      var newUsers = this.state.users.slice();
      newUsers.push({
        name: data.name,
        img: data.img
      });
      this.setState({
        users: newUsers
      });
    }
    globalReact.clearScreen = () => {
      this.setState({
        users: []
      });
    }
    globalReact.removeScreen = (data) => {
      var newUsers = this.state.users.slice();
      for(var i=0, len=newUsers.length; i < len ; i++){
        if(newUsers[i].name == data.name){
          newUsers.splice(i, 1);
          break;
        }
      }
      this.setState({
        users: newUsers        
      })
    }
  }

  addScreen = (data) =>{
    var newUsers = this.state.users.slice();
    newUsers.push({
      name: "newly added",
      img: data
    });
    this.setState({
      users: newUsers
    });
  }

  render(){
    var screens = [<ScreenInput addScreen={this.addScreen}/>];
    this.state.users.forEach(function(el){
      screens.push(<Screen img={el.img} name={el.name}/>);
    });
    return screens;
  }
}

ReactDOM.render(
  <div className="columns is-multiline"><FullScreen/></div>, document.getElementById('root'));