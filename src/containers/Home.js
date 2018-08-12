import React, { Component } from 'react';
import Gallery from '../components/neptunian/Gallery';
import SelectedImage from '../components/neptunian/SelectedImage';
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

// v important directories
let sourceFolderDir = null;

// observables
let photosList = []
let oPhotosList = observable(photosList);

const Home = observer(class Home extends Component {

  constructor(props) {
    super(props)
    this.state = {
      photos: oPhotosList
    }

    this.onPhotoAdded = this.onPhotoAdded.bind(this);
    this.onSourceSelectedHandler = this.onSourceSelectedHandler.bind(this);
  }

  componentDidMount() {
    console.log("Did mount");
    this._mounted = true;
    if (SourceSelectedSub === null) { 
      SourceSelectedSub = emitter.addListener(EVENT_SOURCE_FOLDER_SELECTED,
       this.onSourceSelectedHandler);
    }
    if (PhotoAddedSub === null) {
      PhotoAddedSub = emitter.addListener(EVENT_PHOTO_ADDED, this.onPhotoAdded);
    }
  }

  componentWillMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
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
    oPhotosList.push(image);
  }

  render() {
    return (
      <div className="Home">
        { this.state.photos.length === 0 ? <NothingToShow /> : null }
        <Gallery 
          photos={oPhotosList}
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