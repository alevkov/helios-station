import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import '../styles/Admin.css';
import { emitter,
  EVENT_PHOTO_ADDED,
  EVENT_SOURCE_FOLDER_SELECTED
} from '../common';

// electron packages
const electron = window.require('electron');
const {dialog} = window.require('electron').remote;
const choker = electron.remote.require('chokidar');
const fs = electron.remote.require('fs');
const os = window.require('os');

let _sourceDir = null;
let _sortDir = null;
let _gifDir = null;

class Admin extends Component {
  constructor(props) {
    super(props)

    this.state = {
      sourceDir: _sourceDir,
      sortDir: _sortDir,
      gifDir: _gifDir
    }

    this.onSourceFolderClick = this.onSourceFolderClick.bind(this);
    this.onSortFolderClick = this.onSortFolderClick.bind(this);
    this.onGifFolderClick = this.onGifFolderClick.bind(this);
    this.onPhotoAddedHandler = this.onPhotoAddedHandler.bind(this);
  }

  onSourceFolderClick() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, dir);
          let watchGlob = null;
          // set the watch dir according to OS
          if (os.platform() === 'darwin') {
            watchGlob = dir + '/**/*.jpg';
          } else {
            watchGlob = dir + '\\**\\*.jpg'
          }
          // watch the dir
          const watcher = choker.watch(watchGlob, {
            ignored: /(^|[\/\\])\../,
            persistent: true
          });
          // when a file is added, send event to Home
          watcher.on('add', this.onPhotoAddedHandler);
          _sourceDir = dir;
          // set state
          this.setState({
            sourceDir: _sourceDir
          });
        }
    });
  }

  onSortFolderClick() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          console.log(dir);
          _sortDir = dir;
          this.setState({
            sortDir: _sortDir
          });
        }
    });
  }

  onGifFolderClick() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          _gifDir = dir;
          this.setState({
            gifDir: _gifDir
          });
        }
    });
  }

  onPhotoAddedHandler(path) {
    emitter.emit(EVENT_PHOTO_ADDED, path);
  }

  render() {
    return (
      <div className="Admin">
        <form className="Admin-form">
          <div className="Admin-button">
            <Button onClick={this.onSourceFolderClick}>
              Source Path ⇝
            </Button>
          </div>
          { this.state.sourceDir !== null ? <h4>{this.state.sourceDir}</h4> : null }
          <div className="Admin-button">
            <Button onClick={this.onSortFolderClick}>
              Sorting Path ⇝
            </Button>
          </div>
          { this.state.sortDir !== null ? <h4>{this.state.sortDir}</h4> : null }
          <div className="Admin-button">
            <Button onClick={this.onGifFolderClick}>
              Gif Path ⇝
            </Button>
          </div>
          { this.state.gifDir !== null ? <h4>{this.state.gifDir}</h4> : null }
          <FormControlLabel
            control={
              <Checkbox
                value="checkedA"/>
            }
            label="CREATE .GIF"/>
        </form>
      </div>
    );
  }
}

export default Admin;
