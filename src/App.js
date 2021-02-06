

import React, { useState } from 'react';
import { BrowserRouter, Route, Switch, Link, NavLink } from 'react-router-dom';
import { Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavbarText } from 'reactstrap';
import PreTrainedModel from './views/PreTrainedModel';
import CreateTrainTest from './views/CreateTrainTest';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="App">
      <BrowserRouter>
        <div>
          <Navbar color="light" light expand="md">
            <NavbarBrand href="/toxicity">Toxicity</NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={isOpen} navbar>
              <Nav className="mr-auto" navbar>
                <NavItem>
                  <NavLink exact to="/toxicity" activeStyle={{color: 'red'}}>Pre-Trained Model</NavLink>
                </NavItem>
                <NavItem>&nbsp;</NavItem>
                <NavItem>
                  <NavLink exact to="/toxicity/create_train_test" activeStyle={{color: 'red'}}>Create Train & Test</NavLink>
                </NavItem>
              </Nav>
              <NavbarText>Toxic comment classification using Tensorflow and React.js</NavbarText>
            </Collapse>
          </Navbar>
          <Switch>
            <Route path="/toxicity/create_train_test" component={props => <CreateTrainTest />} />
            <Route path="/toxicity" component={props => <PreTrainedModel />} />
          </Switch>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
