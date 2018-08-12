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

// sub sandwhiches
let SourceSelectedSub = null;
let PhotoAddedSub = null;

// directories
let sourceFolderDir = null;

// observables
let photosList = [];
let o_photosList = observable(photosList);

// declare as observer to observe the state of data structs declared above
const Home = observer(class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      photos: o_photosList,
      selectedPhotosList: new Set()
    }

    this.onPhotoAdded = this.onPhotoAdded.bind(this);
    this.onSourceSelectedHandler = this.onSourceSelectedHandler.bind(this);
    this.selectPhoto = this.selectPhoto.bind(this);
    this.toggleSmsModal = this.toggleSmsModal.bind(this);
  }

  componentDidMount() {
    if (SourceSelectedSub === null) { 
      SourceSelectedSub = emitter.addListener(EVENT_SOURCE_FOLDER_SELECTED,
       this.onSourceSelectedHandler);
    }
    if (PhotoAddedSub === null) {
      PhotoAddedSub = emitter.addListener(EVENT_PHOTO_ADDED, this.onPhotoAdded);
    }
  }

  componentWillMount() {

  }

  componentWillUnmount() {
    //SourceSelectedSub.remove();
  }

  onSourceSelectedHandler(...args)  {
    sourceFolderDir = args[0];
    console.log(sourceFolderDir);
  }

  onPhotoAdded(...args) { 
    let image = {
      src: 'file://' + args[0],
      actual: 'file://' + args[0],
      width: 3,
      height: 2
    }
    console.log("added");
    // add photo to observable array
    o_photosList.push(image);
  }

  selectPhoto(event, obj) {
    console.log(obj.index);
    o_photosList[obj.index].selected = !o_photosList[obj.index].selected;
    if (o_photosList[obj.index].selected === true) {
      this.state.selectedPhotosList.add(obj.index);
    } else {
      this.state.selectedPhotosList.delete(obj.index);
    }
    this.forceUpdate();
  }


  toggleSmsModal() {

  }

  render() {
    return (
      <div className="Home">
        <SharingDock 
          showDock={this.state.selectedPhotosList.size !==0 } 
          toggleSms={this.toggleSmsModal} />
        { this.state.photos.length === 0 ? <NothingToShow /> : null }
        <Gallery 
          photos={o_photosList}
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