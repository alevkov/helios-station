import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import '../styles/Admin.css';
import { emitter,
  EVENT_PHOTO_ADDED,
  EVENT_SOURCE_FOLDER_SELECTED
} from '../common';

const electron = window.require('electron');
const {dialog} = window.require('electron').remote;
const choker = electron.remote.require('chokidar');
const os = window.require('os');

class Admin extends Component {

  constructor(props) {
    super(props)

    this.sourceFolderHandler = this.sourceFolderHandler.bind(this);
    this.sortFolderHandler = this.sortFolderHandler.bind(this);
    this.gifFolderHandler = this.gifFolderHandler.bind(this);
  }

  sourceFolderHandler() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          emitter.emit(EVENT_SOURCE_FOLDER_SELECTED, dir);
          let watchGlob = null;
          if (os.platform() === 'darwin') {
            watchGlob = dir + '/**/*.jpg';
          } else {
            watchGlob = dir + '\\**\\*.jpg'
          }
          const watcher = choker.watch(watchGlob, {
            ignored: /(^|[\/\\])\../,
            persistent: true
          });
          watcher.on('add', path => {
            emitter.emit(EVENT_PHOTO_ADDED, path); // 10 is logged
          });
        }
    });
  }

  sortFolderHandler() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          console.log(dir);
        }
    });
  }

  gifFolderHandler() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          console.log(dir);
        }
    });
  }

  render() {
    return (
      <div className="Admin">
        <form className="Admin-form">
          <div className="Admin-button">
            <Button onClick={this.sourceFolderHandler}>
              Source Path
            </Button>
          </div>
          <div className="Admin-button">
            <Button onClick={this.sortFolderHandler}>
              Sorting Path
            </Button>
          </div>
          <div className="Admin-button">
            <Button onClick={this.gifFolderHandler}>
              Gif Path
            </Button>
          </div>
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
