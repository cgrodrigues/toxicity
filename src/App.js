

import React, { useState } from 'react';
import { BrowserRouter, Route, Switch, Link, NavLink } from 'react-router-dom';
import { Navbar, NavbarBrand, NavbarToggler, Collapse, Nav, NavItem, NavbarText  } from 'reactstrap';
import PreTrainedModel from './views/PreTrainedModel';
import CreateTrainTest from './views/CreateTrainTest';
import Footer from "./components/Footer/Footer.js";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const routerBaseName = "/toxicity";

  return (
    <div className="App">
      <BrowserRouter basename={routerBaseName}>
        <div>
          <Navbar color="light" light expand="md">
            <NavbarBrand href="/">Toxicity</NavbarBrand>
            <NavbarToggler onClick={toggle} />
            <Collapse isOpen={isOpen} navbar>
              <Nav className="mr-auto" navbar>
                <NavItem>
                  <NavLink exact to="/" activeStyle={{color: 'red'}} className="nav-link">Pre-Trained Model</NavLink>
                </NavItem>
                <NavItem>&nbsp;</NavItem>
                <NavItem>
                  <NavLink exact to="/create_train_test" activeStyle={{color: 'red'}} className="nav-link">Create Train & Test</NavLink>
                </NavItem>
              </Nav>
              <NavbarText>Toxic comment classification using Tensorflow and React.js</NavbarText>
            </Collapse>
          </Navbar>
          <Switch>
            <Route path="/create_train_test" component={props => <CreateTrainTest />} />
            <Route path="/" component={props => <PreTrainedModel />} />
          </Switch>
        </div>
      </BrowserRouter>
      <Footer/>
    </div>
  );
}

export default App;
