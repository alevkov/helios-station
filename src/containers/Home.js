import React, { Component } from 'react';
import Gallery from '../components/neptunian/Gallery';
import SelectedImage from '../components/neptunian/SelectedImage';
import SharingDock from '../components/home/SelectDock';
import CloudInterface from '../extras/CloudInterface';
import Lightbox from 'react-images';
import logo from '../logo.svg';
import '../styles/Home.css';
import { 
  emitter,
  EVENT_PHOTO_ADDED,
  EVENT_PHOTO_REMOVED
} from '../common';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

const electron = window.require('electron');
const settings = electron.remote.require('electron-settings');

// declare as observer to observe the state of data structs declared above
const Home = observer(class Home extends Component {
  // sub sandwhiches
  static _PhotoAddedSub = null;
  static _PhotoRemovedSub = null;
  // observables
  static o_photosList = observable([]);

  constructor(props) {
    super(props)
    this.state = {
      photos: Home.o_photosList,
      selectedPhotosList: new Set()
    }
  }

  componentDidMount() {
    if (Home._PhotoAddedSub === null) {
      Home._PhotoAddedSub = emitter.addListener(EVENT_PHOTO_ADDED,
       this.onPhotoAddedHandler);
    }
    if (Home._PhotoRemovedSub === null) {
      Home._PhotoRemovedSub = emitter.addListener(EVENT_PHOTO_REMOVED,
       this.onPhotoRemovedHandler);
    }
  }

  onPhotoAddedHandler = (...args) => { 
    let image = {
      src: 'file://' + args[0],
      actual: args[0],
      eventcode: settings.get('event.name'),
      width: 3,
      height: 2
    }
    console.log('added');
    // add photo to observable array
    Home.o_photosList.push(image);
  }

  onPhotoRemovedHandler = (...args) => {
    // remove path from observable array
    const removedPath = args[0];
    const idx = Home.o_photosList.findIndex((item, index, array) => {
      return item.src === 'file://' + removedPath;
    });
    Home.o_photosList.remove(Home.o_photosList[idx]);
  }

  selectPhoto = (event, obj) => {
    console.log(obj.index);
    Home.o_photosList[obj.index].selected = !Home.o_photosList[obj.index].selected;
    if (Home.o_photosList[obj.index].selected === true) {
      this.state.selectedPhotosList.add(obj.index);
    } else {
      this.state.selectedPhotosList.delete(obj.index);
    }
    this.forceUpdate();
  }

  getSelectedPhotosList = () => {
    let selectedPhotosPaths = [];
    this.state.selectedPhotosList.forEach(i => {
      selectedPhotosPaths.push(Home.o_photosList[i].actual)
    });
    return selectedPhotosPaths;
  }

  toggleModal = name => () => {
    console.log(name);
  }

  onLoveItClick = () => {
    const cloud = new CloudInterface();
    const selected = this.getSelectedPhotosList();
    cloud.upload(selected);
  }

  render() {
    return (
      <div className='Home'>
        <SharingDock 
          showDock={this.state.selectedPhotosList.size !==0 } 
          toggleModal={this.toggleModal}
          onLoveItClick={this.onLoveItClick} />
        { this.state.photos.length === 0 ? <NothingToShow /> : null }
        <Gallery 
          photos={Home.o_photosList}
          onClick={this.selectPhoto}
          ImageComponent={SelectedImage} />
      </div>
    );
  }
})

const NothingToShow = () => (
  <div className='NotFound'>
    <h3>No photos to display.</h3>
  </div>
)

export default Home;