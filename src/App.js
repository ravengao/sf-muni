import React, { Component } from 'react';
import './App.css';
import SFMap from "./components/SFMap"

class App extends Component {
  render() {
    const width = 900;
    const height = 750;
    return (
      <div className="App">
        <SFMap width={width} height={height}/>
      </div>
    );
  }
}

export default App;
