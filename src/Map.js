import React, { useRef, useEffect, useState, Component } from 'react';

// eslint-disable-next-line import/no-webpack-loader-syntax
import mapboxgl from '!mapbox-gl';
import './Map.css';

import Tooltip from './components/Tooltip';
import ReactDOM from 'react-dom';
import * as MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import $ from 'jquery';
import axios from 'axios';

mapboxgl.accessToken =
  'pk.eyJ1IjoiaXJ3aW5lMm0ybSIsImEiOiJja3R1OTRza2UxYm5uMm5sNTFrMHcyNzI5In0.AbFNwZoufYECpCloewqaIA';

let map;
let geocoder;
export default class Map extends Component {
  
  constructor(props){
      super(props)
      this.state = {
        data: [],
        lng:-84.6303753,
        lat:33.6658323,
        zoom:4.50,
        DigJsone:[],
        DigRenderdData:[],
        DigStatus:[],
        DigPhase:[],
        DigPipeline:[],
        ActiveDigsCount:0,
        ArchivedDigsCount:0,
        RequestedDigsCount:0,
        OnHoldCount:0,
        SingleDigData:null
      }
      this.mapContainerRef = React.createRef();
    }
  
    componentDidMount(){
      map = new mapboxgl.Map({
        container: this.mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [this.state.lng, this.state.lat],
        zoom: this.state.zoom,
      });
  
      geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        zoom: 7.50,
        mapboxgl: mapboxgl,
        marker: false,
      })
      document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
      //map.addControl(geocoder);
  
      // Add navigation control (the +/- zoom buttons)
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  
      const filterInput = document.getElementById('Dignumber');
      const digstatus = document.getElementById('digstatus');
      const digphase = document.getElementById('digphase');
      const Pipelinealias = document.getElementById('Pipelinealias');
      map.on('load', () => {
        (async () => {
            try {
              await axios.get("/data.json").then(response => response.data)
                  .then((myJson) => {
                  
                      var CreateCollection = [];
                      var CreateNewArr = [];
                      let CreateStatus = [];
                      let CreatePhase = [];
                      let CreatePipeline = [];
                      var that = this;
                      Object.values(myJson.Digs).forEach(function(element) {
                      //myJson.Digs.forEach((element, key) => {
                          CreateNewArr.push(element)

                          if(CreateStatus.indexOf(element.dig_status) === -1){
                            CreateStatus.push(element.dig_status)
                          }
                          if(CreatePhase.indexOf(element.dig_statusdata_phase) === -1){
                            CreatePhase.push(element.dig_statusdata_phase)
                          }
                          if(CreatePipeline.indexOf(element.pipeline_alias) === -1 && element.pipeline_alias !== ""){
                            CreatePipeline.push(element.pipeline_alias)
                          }
                          let colorSet = "#f49333"
                          if(element.dig_status === "Archived"){
                            that.state.ArchivedDigsCount = (that.state.ArchivedDigsCount + 1); 
                            colorSet = "#5cbe40";
                          }else if(element.dig_status === "Active"){
                            that.state.ActiveDigsCount = (that.state.ActiveDigsCount + 1); 
                            colorSet = "#2d9aff";
                          }else if(element.dig_status === "On Hold"){
                            that.state.OnHoldCount = (that.state.OnHoldCount + 1); 
                            colorSet = "#ef5613";
                          }else{
                            that.state.RequestedDigsCount = (that.state.RequestedDigsCount + 1); 
                          }
                          //console.log("DigJsone CreateStatus",CreateStatus.indexOf(element.dig_status))
                          var obj = {
                            'type': 'Feature',
                            'properties': {
                              'description':'<p>'+element.project_name+'</p>',
                              'digNumber' : element.dig_number,
                              'dig_status' : element.dig_status,
                              'dig_statusdata_phase' : element.dig_statusdata_phase,
                              'pipeline_alias' : element.pipeline_alias,
                              'color': colorSet
                            },
                            'geometry': {
                              'type': 'Point',
                              'coordinates': [parseFloat(parseFloat(element.geo_longitude).toFixed(6)),parseFloat(parseFloat(element.geo_latitute).toFixed(6))]
                            }
                          }
                          CreateCollection.push(obj)
                      });
                      this.state.DigJsone = CreateNewArr;
                      this.state.DigStatus = CreateStatus;
                      this.state.DigPhase = CreatePhase;
                      this.state.DigPipeline = CreatePipeline;
                      var places = {
                        'type': 'FeatureCollection',
                        'features': CreateCollection
                      }
                      this.setState({
                        DigRenderdData : places,
                      })
                      map.addSource('places3', {
                        'type': 'geojson',
                        'data': places
                      });
  
                      map.addLayer({
                        'id': 'places',
                        'type': 'circle',
                        'source': 'places3',
                        'paint': {
                          'circle-color': ['get', 'color'],
                          'circle-radius': 8,
                          'circle-stroke-width': 1,
                          'circle-stroke-color': '#ffffff'
                        },
                      });
  
                      console.log("this.state.DigJsone",this.state.DigJsone)
                  })
            } catch {
                alert("data fetch error")
            }
            
        })()
          
        filterInput.addEventListener('keyup', (e) => {
              FilderData()
          });
        })
        let that = this;
        $(digstatus).select2({ 
                      width: '100%',
                      allowClear: true,
                      placeholder: "Select Dig Status",
                    }).on("select2:select", function (e) {
                        FilderData()
                    }).on("select2:clear", function (e) {
                        FilderData()
                    });
        $(digphase).select2({ 
                      width: '100%',
                      allowClear: true,
                      placeholder: "Select Dig Phase",
                    }).on("select2:select", function (e) {
                        FilderData()
                    }).on("select2:clear", function (e) {
                        FilderData()
                    });
        $(Pipelinealias).select2({ 
                      width: '100%',
                      allowClear: true,
                      placeholder: "Select Pipeline Alias",
                    }).on("select2:select", function (e) {
                        FilderData()
                    }).on("select2:clear", function (e) {
                        FilderData()
                    });

        const FilderData = async(params) => {
          var Pipelinealias = $("#Pipelinealias").val();
          var digphase = $("#digphase").val();
          var digstatus = $("#digstatus").val();
          var Dignumber = $("#Dignumber").val().trim();

          const newGeoJSON = {...this.state.DigRenderdData };
          newGeoJSON.features = that.state.DigRenderdData.features
                                .filter(feature => 
                                        feature.properties.pipeline_alias.includes(Pipelinealias) &&
                                        feature.properties.digNumber.includes(Dignumber) &&
                                        feature.properties.dig_statusdata_phase.includes(digphase) &&
                                        feature.properties.dig_status.includes(digstatus)
                                        );
          console.log("newGeoJSON",newGeoJSON.features)
          map.getSource('places3').setData(newGeoJSON);
        }

      map.on('click', 'places', (e) => {
          // Copy coordinates array.
          const coordinates = e.features[0].geometry.coordinates.slice();
          const description = e.features[0].properties.description;
          
          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          
          new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
      });

      map.on('move', () => {
        this.setState({
          lng : map.getCenter().lng.toFixed(4),
          lat : map.getCenter().lat.toFixed(4),
          zoom : map.getZoom().toFixed(2)
        })
      });

      // change cursor to pointer when user hovers over a clickable feature
      map.on('mouseenter', e => {

        if (e.features.length) {
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      // reset cursor to default when user is no longer hovering over a clickable feature
      map.on('mouseleave', () => {
        map.getCanvas().style.cursor = '';
      });

      // add tooltip when users mouse move over a point
      map.on('mousemove', e => {
        const features = map.queryRenderedFeatures(e.point);
        if (features.length) {
          //console.log("features",features)
          const feature = features[0];

          // Create tooltip node
          const tooltipNode = document.createElement('div');
          ReactDOM.render(<Tooltip feature={feature} />, tooltipNode);
        }
      });
      
      $(document).ready(function(){
        $(".openCanvas").click(function(){
          $(".offcanvas-bottom").addClass("show");
        });
        $(".closeCanvas").click(function(){
          $(".offcanvas-bottom").removeClass("show");
        });
        $(".openCanvasLeft").click(function(){
          $(".offcanvas-left").addClass("show");
        });
        $(".closeCanvasLeft").click(function(){
          $(".offcanvas-left").removeClass("show");
        });
        $(".backTolist").click(function(){
          $("#digListNev").css("display","block")
          $("#detailDig").css("display","none")

          map.flyTo({
              center: [that.state.lng,that.state.lat],
              zoom: 4.50,
              bearing: 0,
              essential: true
            });
        });

        $('#myUL').slimScroll({
          height: 'calc(100% - 72px)'
        });
        //$('.js-example-basic-single').select2({ width: '100%' });
        
    
        // $("#state").change(function(params) {
        //   geocoder.query($("#state").val(), showMap);
        // })
        $(document).on("click",".collapsed",function() {
          if($(this).parent().parent().find('.collapse').hasClass('show')){
            $(this).parent().parent().find('.collapse').removeClass('show');
          }else{
            $(this).parent().parent().find('.collapse').addClass('show');
          }
        })

      });
    }

    ClickOnSingleDig = (item) =>{
      console.log(item)
      this.setState({
        SingleDigData : item
      })
      setTimeout(() => {
        $("#digListNev").css("display","none")
        $("#detailDig").css("display","block")
        console.log("SingleDigData",this.state.SingleDigData)

        map.flyTo({
            center: [parseFloat(parseFloat(this.state.SingleDigData.geo_longitude).toFixed(6)),parseFloat(parseFloat(this.state.SingleDigData.geo_latitute).toFixed(6))],
            zoom: 15,
            bearing: 0,
            // this animation is considered essential with respect to prefers-reduced-motion
            essential: true
          });
      }, 500);
    }

    render() {

      function myFunction() {
        // Declare variables
        var input, filter, ul, li, a, i, txtValue;
        input = document.getElementById('myInput');
        filter = input.value.toUpperCase();
        ul = document.getElementById("myUL");
        li = ul.getElementsByTagName('li');
      
        // Loop through all list items, and hide those who don't match the search query
        for (i = 0; i < li.length; i++) {
          a = li[i].getElementsByTagName("a")[0];
          txtValue = a.textContent || a.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
          } else {
            li[i].style.display = "none";
          }
        }
      }
        var that = this;
        return (
          <div>
          <div className="container">
            <div className="jumbotron mt-3">
              <div>
                <div className='sidebarStyle'>
                  <div>
                    Longitude: {this.state.lng} | Latitude: {this.state.lat} | Zoom: {this.state.zoom}
                  </div>
                </div>
                <div className='map-container' ref={this.mapContainerRef} />
              </div>
            </div>
          </div>
  
          <button className="btn btn-light openCanvasLeft onoffBtn" type="button"><i className="fas fa-chevron-right"></i></button>
          <div className="offcanvas offcanvas-left">
            <div id="digListNev" className="h-100">
              <div className="offcanvas-header">

                <div className="search-header">
                <input type="text" id="myInput" className="form-control" onKeyUp={myFunction} placeholder="Search for names.." />
                <i className="fas fa-search"></i>
                </div>
                <a href="/#" className="backTolist"><i className="fas fa-close closeCanvasLeft"></i></a>
              </div>
              {/* this.state.DigJsone */}
              <ul id="myUL">
                {this.state.DigJsone.map(function(object, index){
                    return <li onClick={() => that.ClickOnSingleDig(object)} key={index}>
                    <a href="/#" >
                      {object.dig_number}
                      <span className="activedigSpan">{object.dig_status} - {object.dig_statusdata_phase}</span>
                      <span className={object.dig_status} ></span>
                    </a>
                    </li>
                })}
              </ul>
            </div>
            <div id="detailDig" className="h-100" style={{ 'display':'none' }}>
              <div className="offcanvas-header">
                <h4><a href="/#" className="backTolist"><i className="fas fa-arrow-left"></i></a> Dig Details</h4>
                {/* <a href="/#"><i className="fas fa-print"></i></a> */}
                <a href="/#"><i className="fas fa-close closeCanvasLeft"></i></a>
              </div>
              
              <div className="offcanvas-body custom-scroll">
                  <div className="vng-container">
                      <h5 className="vng-title">{this.state.SingleDigData?.dig_number}</h5><span className="mr-3 vng-span">Status: {this.state.SingleDigData?.dig_status}</span><span
                          className="vng-span">Phase: {this.state.SingleDigData?.dig_statusdata_phase}</span><br />
                      <div className="justify-content-between"><label className="featureLable2">Source:</label>
                          <div className="featureAns">{this.state.SingleDigData?.dig_source}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Priority:</label>
                          <div className="featureAns">{this.state.SingleDigData?.dig_priority}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Type:</label>
                          <div className="featureAns">{this.state.SingleDigData?.dig_type}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Year:</label>
                          <div className="featureAns">{this.state.SingleDigData?.form_year}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Location Code:</label>
                          <div className="featureAns">{this.state.SingleDigData?.location_code}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Nearest intersection:</label>
                          <div className="featureAns">{this.state.SingleDigData?.location_nearestintersection}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Status Code:</label>
                          <div className="featureAns">{this.state.SingleDigData?.dig_statusalt_primary_code}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Status Phase:</label>
                          <div className="featureAns">{this.state.SingleDigData?.dig_statusdata_phase}</div>
                      </div>
                      <hr />
                      <div className="justify-content-between"><label className="featureLable2">Compliance Date:</label>
                          <div className="featureAns">{this.state.SingleDigData?.compliance_date}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Target date:</label>
                          <div className="featureAns">{this.state.SingleDigData?.compliance_targetdate}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Reason:</label>
                          <div className="featureAns">{this.state.SingleDigData?.compliance_targetreason}</div>
                      </div>
                      <hr />
                      <div className="justify-content-between"><label className="featureLable2">Project Name:</label>
                          <div className="featureAns">{this.state.SingleDigData?.project_name}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Year:</label>
                          <div className="featureAns">{this.state.SingleDigData?.form_year}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Project PM:</label>
                          <div className="featureAns">{this.state.SingleDigData?.project_pm}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Requestor:</label>
                          <div className="featureAns">{this.state.SingleDigData?.project_requestor}</div>
                      </div>
                      <div className="justify-content-between"><label className="featureLable2">Service Center:</label>
                          <div className="featureAns">{this.state.SingleDigData?.servicecenter_number}</div>
                      </div>
                  </div>
                  {/* <div className="height200">
                  </div> */}
                  <br />
              <div id="accordion">
              {this.state.SingleDigData?.DigFeatures.map(function(object, index){
                return <div className="card digdetail-card">
                  <div className="card-header" id={index + object.feature_pflnum } >
                    <a className="card-link a-collapsed collapsed" data-toggle="collapse" href={'#' +index + object.feature_pflnum + index} >
                    Feature {object.feature_pflnum}
                    </a>
                  </div>
  
                  <div id={index + object.feature_pflnum + index} className="collapse" aria-labelledby={index + object.feature_pflnum } data-parent="#accordion">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2"><label className="featureLable">PFL #:</label>
                            <div className="featureAns">{object.feature_pflnum}</div>
                        </div>
                        <div className="d-flex justify-content-between mb-2"><label className="featureLable">Feature Type:</label>
                            <div className="featureAns">{object.feature_type}</div>
                        </div>
                        <div className="d-flex justify-content-between mb-2"><label className="featureLable">Disposition final:</label>
                            <div className="featureAns">{object.disposition_final}</div>
                        </div>
                        <div className="d-flex justify-content-between mb-2"><label className="featureLable">Disposition Initial:</label>
                            <div className="featureAns">{object.disposition_initial}</div>
                        </div>
                        <div className="d-flex justify-content-between mb-2"><label className="featureLable">Destructive Testing:</label>
                            <div className="featureAns">{object.testingmethod_destructive}</div>
                        </div>
                        <div className="d-flex justify-content-between mb-2"><label className="featureLable">Non Destructive Testing:</label>
                            <div className="featureAns">{object.testingmethod_nondestructive}</div>
                        </div>
                    </div>
                  </div>
                </div>
              })}
                
              </div>
                
              </div>
            </div>
          </div>
  
          <button className="btn btn-light openCanvas onoffBtn" type="button"><i className="fas fa-chevron-up"></i></button>
  
          <div className="offcanvas offcanvas-bottom" id="offcanvasBottom" aria-labelledby="offcanvasBottomLabel">
            <button className="btn btn-light closeCanvas onoffBtn"><i className="fas fa-chevron-down"></i></button>
            <div className="container-fluid">
              <div className="row">
                <div className="col-xl-8 col-lg-7 col-sm-8 col-md-12">
                  <div className="row select-row">
                    <div className="col-lg-6 col-md-6">
                      <div className="form-group">
                        <label className="form_lable">Search Location</label>
                        <div id="geocoder" className="geocoder"></div>
                        {/* <input type="text" id="geocoder" className="geocoder form-control" placeholder="Search Location" /> */}
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6">
                      <div className="form-group select_drop">
                        <label className="form_lable">Pipeline alias</label>
                        <select style={{ 'maxWidth':325 }} className="js-example-basic-single form-control" id="Pipelinealias" name="alias">
                            <option></option>
                            {this.state.DigPipeline.map(function(object, index){
                              return <option value={object} key={index} >{object}</option>
                            })}
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-4">
                      <div className="form-group select_drop">
                        <label className="form_lable">Dig Phase</label>
                        <select className="js-example-basic-single form-control" id="digphase" name="digphase">
                            <option></option>
                            {this.state.DigPhase.map(function(object, index){
                              return <option value={object} key={index} >{object}</option>
                            })}
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-4">
                      <div className="form-group select_drop">
                        <label className="form_lable">Dig Status</label>
                        <select className="js-example-basic-single form-control" id="digstatus" name="digstatus">
                            <option></option>
                            {this.state.DigStatus.map(function(object, index){
                              return <option value={object} key={index}>{object}</option>
                            })}
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-4">
                      <div className="form-group">
                        <label className="form_lable">Dig number</label>
                        <input type="text" id="Dignumber" className="form-control" placeholder="Enter Dig number" />
                      </div>
                    </div>
                    
                  </div>
                </div>
                <div className="col-xl-4 col-lg-5 col-sm-4 col-md-12 border-left-col">
                  <div className="row form-row digs-row">
                    <div className="col-sm-6">
                      <div className="form-group">
                        <div className="card digs-card actvie_digs">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5>Active Digs</h5>
                              <span>{this.state.ActiveDigsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <div className="card digs-card archive_digs">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5>Archived Digs</h5>
                              <span>{this.state.ArchivedDigsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <div className="card digs-card requested_digs">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5>Requested Digs</h5>
                              <span>{this.state.RequestedDigsCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="form-group">
                        <div className="card digs-card onHold">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5>On Hold</h5>
                              <span>{this.state.OnHoldCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>              
            </div>
          </div>
      </div>
      
        )
    }
}


