

import React, { useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavLink, NavbarText } from 'reactstrap';
import Toxicity from './views/Toxicity';
import About from './views/About';

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
                  <NavLink href="/">Home</NavLink>
                </NavItem>
                <NavItem>
                  <NavLink href="/about">About</NavLink>
                </NavItem>
              </Nav>
              <NavbarText>Toxic comment classification using Tensorflow and react.js</NavbarText>
            </Collapse>
          </Navbar>
          <Switch>
            <Route path="/about" component={props => <About />} />
            <Route path="/" component={props => <Toxicity />} />
          </Switch>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
