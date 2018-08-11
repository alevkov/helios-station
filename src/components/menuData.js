// This file is shared across the demos.

import React from 'react';
import { Link } from 'react-router-dom';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

export const menuItems = (
  <div>
    <ListItem button>
      <Link to="/">
        <ListItemText primary="Event" />
      </Link>
    </ListItem>
    <ListItem button>
      <Link to="/admin">
        <ListItemText primary="Admin" />
      </Link>
    </ListItem>
  </div>
);