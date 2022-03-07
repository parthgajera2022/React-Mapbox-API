import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'select2/dist/css/select2.min.css';
import './index.css';
import jquery from 'jquery';

import $ from 'jquery';  // eslint-disable-next-line
import Popper from 'popper.js';   // eslint-disable-next-line
import 'bootstrap/dist/js/bootstrap.bundle.min'; 
import 'select2/dist/js/select2.full.min.js';
//import 'jquery-slimscroll/jquery.slimscroll.js'; 

import App from './App';
window.$ = window.jQuery = jquery;
require('jquery-slimscroll');

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
