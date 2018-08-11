import React, { Component } from 'react';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import { menuItems } from './components/menuData';
import Routes from './Routes';
import logo from './logo.svg';
import './App.css';

const styles = {
  list: {
    width: 250,
  },
  fullList: {
    width: 'auto',
  },
};

class App extends Component {
  state = {
    menuOpen: false
  };

  toggleDrawer = (open) => () => {
    this.setState({
      menuOpen: open,
    });
  };

  render() {
    const sideList = (
      <div className="menuList">
        <List>{menuItems}</List>
      </div>
    );
    return (
      <div className="App-container">
        <Button
          style={{ fontSize: '25px'}}
          onClick={this.toggleDrawer(true)}>&#9776;</Button>
        <Drawer open={this.state.menuOpen} onClose={this.toggleDrawer(false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer(false)}
            onKeyDown={this.toggleDrawer(false)}>
            {sideList}
          </div>
        </Drawer>
        <Routes />
      </div>
    );
  }
}

export default App;
