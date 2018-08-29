import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Home from './containers/Home';
import Admin from './containers/Admin';
import NotFound from './containers/NotFound';

export default () =>
  <Switch>
    <Route path="/" exact component={Home} />
    <Route path="/admin" exact component={Admin} />
    <Route component={Home} />
  </Switch>;