import React, { Component } from 'react';
import Gallery from '../components/neptunian/Gallery';
import SelectedImage from '../components/neptunian/SelectedImage';
import SharingDock from '../components/SelectDock';
import Lightbox from 'react-images';
import logo from '../logo.svg';
import '../styles/Home.css';
import { 
  emitter,
  EVENT_PHOTO_ADDED,
  EVENT_SOURCE_FOLDER_SELECTED
} from '../common';
import { observable, reaction, toJS, autorun } from 'mobx';
import { observer } from 'mobx-react';

let photosList = [];

// declare as observer to observe the state of data structs declared above
const Home = observer(class Home extends Component {

  // sub sandwhiches
  static _SourceSelectedSub = null;
  static _PhotoAddedSub = null;

  // directories
  static _sourceFolderDir = null;

  // observables
  static o_photosList = observable(photosList);

  constructor(props) {
    super(props)
    this.state = {
      photos: Home.o_photosList,
      selectedPhotosList: new Set()
    }

    this.onPhotoAddedHandler = this.onPhotoAddedHandler.bind(this);
    this.onSourceSelectedHandler = this.onSourceSelectedHandler.bind(this);
    this.selectPhoto = this.selectPhoto.bind(this);
    this.toggleSmsModal = this.toggleSmsModal.bind(this);
  }

  componentDidMount() {
    if (Home._SourceSelectedSub === null) { 
      Home._SourceSelectedSub = emitter.addListener(EVENT_SOURCE_FOLDER_SELECTED,
      this.onSourceSelectedHandler);
    }
    if (Home._PhotoAddedSub === null) {
      Home._PhotoAddedSub = emitter.addListener(EVENT_PHOTO_ADDED, this.onPhotoAddedHandler);
    }
  }

  componentWillMount() {

  }

  componentWillUnmount() {
    //_SourceSelectedSub.remove();
  }

  onSourceSelectedHandler(...args)  {
    Home._sourceFolderDir = args[0];
    console.log(Home._sourceFolderDir);
  }

  onPhotoAddedHandler(...args) { 
    let image = {
      src: 'file://' + args[0],
      actual: 'file://' + args[0],
      width: 3,
      height: 2
    }
    console.log("added");
    // add photo to observable array
    Home.o_photosList.push(image);
  }

  selectPhoto(event, obj) {
    console.log(obj.index);
    Home.o_photosList[obj.index].selected = !Home.o_photosList[obj.index].selected;
    if (Home.o_photosList[obj.index].selected === true) {
      this.state.selectedPhotosList.add(obj.index);
    } else {
      this.state.selectedPhotosList.delete(obj.index);
    }
    this.forceUpdate();
  }


  toggleSmsModal() {
    //
  }

  render() {
    return (
      <div className="Home">
        <SharingDock 
          showDock={this.state.selectedPhotosList.size !==0 } 
          toggleSms={this.toggleSmsModal} />
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
  <div className="NotFound">
    <h3>No photos to display.</h3>
  </div>
)

export default Home;