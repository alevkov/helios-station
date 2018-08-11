import React from 'react';
import Button from '@material-ui/core/Button';
import '../styles/Admin.css';

export default () =>
  <div className="Admin">
    <form className="Admin-form">
      <div>
        <Button variant="outlined">
          Source Folder
        </Button>
      </div>
      <div className="Admin-button">
        <Button variant="outlined">
          Sorting Folder
        </Button>
      </div>
      <div className="Admin-button">
        <Button variant="outlined">
          Gif Folder
        </Button>
      </div>
    </form>
  </div>;