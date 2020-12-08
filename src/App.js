

import React, { useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink, NavbarText } from 'reactstrap';
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
            <NavbarBrand href="/">Toxicity</NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={isOpen} navbar>
              <Nav className="mr-auto" navbar>
                <NavItem>
                  <NavLink href="/">Pre-Trained Model</NavLink>
                </NavItem>
                <NavItem>
                  <NavLink href="/CreateTrainTest">Create Train & Test</NavLink>
                </NavItem>
              </Nav>
              <NavbarText>Toxic comment classification using Tensorflow and React.js</NavbarText>
            </Collapse>
          </Navbar>
          <Switch>
            <Route path="/CreateTrainTest" component={props => <CreateTrainTest />} />
            <Route path="/" component={props => <PreTrainedModel />} />
          </Switch>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
