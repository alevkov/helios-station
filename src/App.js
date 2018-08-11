import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const electron = window.require('electron');
const {dialog} = window.require('electron').remote;
const choker = electron.remote.require('chokidar');

/*
choker.watch('.', {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
  console.log(event, path);
});*/

class App extends Component {
  render() {
    /*
    dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
    }, function (files) {
        if (files !== undefined) {
            // handle files
        }
    });*/
    return (
      <div className="App">

      </div>
    );
  }
}

export default App;
