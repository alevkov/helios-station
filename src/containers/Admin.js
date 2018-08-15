import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import '../styles/Admin.css';
import SortingEngine from '../extras/SortingEngine';

// electron packages 
const electron = window.require('electron'); 
const {dialog} = window.require('electron').remote; 

class Admin extends Component {

  // hash map of reactive directories
  static _dirMap = {
    source: null,
    sort: null,
    media: null
  }

  // sorting engine instance
  static _sortingEngine = null;

  constructor(props) {
    super(props)

    this.state = {
      sourceDir: Admin._dirMap.source,
      sortDir: Admin._dirMap.sort,
      mediaDir: Admin._dirMap.media
    }

    this.onSourceFolderClick = this.onSourceFolderClick.bind(this);
    this.onSortFolderClick = this.onSortFolderClick.bind(this);
    this.onMediaFolderClick = this.onMediaFolderClick.bind(this);
    this.onDirSelectedHandler = this.onDirSelectedHandler.bind(this);
  }

  onSourceFolderClick() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelectedHandler('source', dir);
          this.setState({
            sourceDir: Admin._dirMap.source
          });
        }
    });
  }

  onSortFolderClick() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelectedHandler('sort', dir);
          this.setState({
            sortDir: Admin._dirMap.sort
          });
        }
    });
  }

  onMediaFolderClick() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, (dir) => {
        if (dir !== undefined) {
          this.onDirSelectedHandler('media', dir);
          this.setState({
            mediaDir: Admin._dirMap.media
          });
        }
    });
  }

  onDirSelectedHandler(type, dir) {
    // fill dir map
    switch (type) {
      case 'source': {
        Admin._dirMap.source = dir;
        break;
      }
      case 'sort': {
        Admin._dirMap.sort = dir;
        break;
      }
      case 'media': {
        Admin._dirMap.media = dir;
        break;
      }
      default: {
        throw new Error('Invalid folder type!');
        break;
      }
    }
    if (Admin._dirMap.source !== null &&
        Admin._dirMap.sort !== null &&
        Admin._dirMap.media !== null) {
      console.log('are we there yet?');
      // initialize sorting engine
      Admin._sortingEngine =
        new SortingEngine(Admin._dirMap.source, Admin._dirMap.sort);
    }
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
            <Button onClick={this.onMediaFolderClick}>
              Media Path ⇝
            </Button>
          </div>
          { this.state.mediaDir !== null ? <h4>{this.state.mediaDir}</h4> : null }
          <FormControlLabel
            control={
              <Checkbox
                value="checkedA"/>
            }
            label="Generate Media"/>
        </form>
      </div>
    );
  }
}

export default Admin;
