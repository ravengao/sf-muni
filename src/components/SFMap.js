import React from "react"
import './SFMap.css'
import Checklist from "./Checklist"
import * as d3 from "d3"

class SFMap extends React.Component {
    constructor(props){
        super(props)
        const {width,height} = this.props;
        this.state = {
            projection: d3.geoMercator()
                .center([-122.4194, 37.7749]) //SF coordinates
                .scale(280000)
                .translate([(width) / 2, (height)/2]),
            vehicleCoord:[],
            routeData:[],   
            lineData:new Map(),
            routeColor:new Map(), //color map, calculated from NextBus route color scheme
            ifLineEnabled:false,
            checkedBoxes:[]
        }
    }

    // Cancelable promise to prevent updating unmounted component error
    // Source: React official document
    makeCancelable = (promise) => {
        let hasCanceled_ = false;        
        const wrappedPromise = new Promise((resolve, reject) => {
            promise.then(
            val => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
            error => hasCanceled_ ? reject({isCanceled: true}) : reject(error)
            );
        });        
        return {
            promise: wrappedPromise,
            cancel() {
            hasCanceled_ = true;
            },
        };
    };

    componentDidMount(){
        d3.queue()
            .defer(d3.json,"data/neighborhoods.json")
            .defer(d3.json,"data/arteries.json")
            .defer(d3.json,"data/streets.json")
            .defer(d3.json,"data/freeways.json")
            .await(this.renderMap);  
    }

    componentWillUnmount(){
        clearInterval(this.interval);
    }

    componentDidUpdate(prevProps,prevState){        
        if(prevState.vehicleCoord !== this.state.vehicleCoord){
            // Use cancelablepromise to prevent updating unmounted component error
            const cancelablePromise = this.makeCancelable(
                new Promise(r => this.renderVehicles(this.state.vehicleCoord))
            );            
            cancelablePromise
                .promise
                .then(() => console.log('resolved'))
                .catch((reason) => console.log('isCanceled', reason.isCanceled));
        }
        if(prevState.lineData !== this.state.lineData){
            // render line doesn not need to update state
            if(this.state.ifLineEnabled){
                this.renderTrack(this.state.lineData)
            }
        }
    }

    fetchVehicleData = (params) => {
        const url = new URL("http://webservices.nextbus.com/service/publicJSONFeed")
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
        fetch(url) 
        .then((response) => response.json())
        .then((data) => {
            // prevent fetching empty data
            if(data.vehicle !== undefined){
                // update line data
                if (this.state.ifLineEnabled) {
                    const projection = this.state.projection
                    data.vehicle.forEach((d)=>{
                        if(this.state.lineData.has(d.id)){
                            let prevCoord = this.state.lineData.get(d.id).data
                            let lastElement = prevCoord[prevCoord.length - 1]
                            let newCoord = projection([d.lon,d.lat])
                            // remove duplicate line data
                            if (!(lastElement.every((v,i) => v === newCoord[i]))){
                                this.state.lineData.set(d.id,{
                                    routeTag:d.routeTag,
                                    data:prevCoord.concat([newCoord])
                                })
                            }
                        }else{
                            let newCoord = projection([d.lon,d.lat])
                            this.state.lineData.set(d.id,{
                                routeTag:d.routeTag,
                                data:[newCoord]
                            })
                        }
                    })
                }
                //update vehicle data
                this.setState({
                    vehicleCoord:data.vehicle
                })
            }else{
                this.setState({
                    vehicleCoord:[]
                })
            }
        })
        .catch((err) =>{
            console.log(err)
        });
    }

    fetchRouteData = (params) => {
        const url = new URL("http://webservices.nextbus.com/service/publicJSONFeed")
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
        fetch(url) 
            .then((response) => response.json())
            .then((data) => {
                this.setState({
                    routeData:data.route
                })
                this.state.routeData.forEach((d)=>{
                    this.state.routeColor.set(d.tag,d.color)
                    this.state.checkedBoxes.push(d.tag)
                }); 
                let params = {
                    command:"vehicleLocations",
                    a:"sf-muni",
                    t:"0"
                }     
                //first render has to be after receving routeData(for color render)
                this.fetchVehicleData(params)    
            })
            .catch((err) =>{
                console.log(err)
            });
    }
    
    renderMap = (error,mapData,arteriesData,streetsData,freewaysData) => {
        let svg = d3.select(this.svgNode)
        let projection = this.state.projection
          
        let path = d3.geoPath().projection(projection);

        //create neighborhood map
        svg.selectAll(".neighborhoods")
            .data(mapData.features)
            .enter().append("path")
            .attr("class","neighborhoods")
            .attr("d", path);
        
        //draw streets
        svg.selectAll(".streets")
            .data(streetsData.features)
            .enter().append("path")
            .attr("class","streets")
            .attr("d", path);
        
        //draw arteries
        svg.selectAll(".arteries")
            .data(arteriesData.features)
            .enter().append("path")
            .attr("class","arteries")
            .attr("d", path);

        //draw freeways
        svg.selectAll(".freeways")
            .data(freewaysData.features)
            .enter().append("path")
            .attr("class","freeways")
            .attr("d", path);     
        
        // get routeData, get color scheme
        // fetchVehicleData has to be done after map is rendered to prevent display mess      
        this.fetchRouteData({
            command:"routeConfig",
            a:"sf-muni"
        }) 
        let params = {
            command:"vehicleLocations",
            a:"sf-muni",
            t:"0"
        }
        // intervalTime can be set with different value
        const intervalTime = 5000 //15000
        this.interval = setInterval(()=>{
            this.fetchVehicleData(params)
        },intervalTime) 
    }
    
    renderVehicles = (vehicleData) => {
        let svg = d3.select(this.svgNode)
        let projection = this.state.projection
        
        vehicleData.forEach((d)=>{
            d.lon = +d.lon
            d.lat = +d.lat
        })
        let vehicles = svg.selectAll(".vehicles").data(vehicleData,(d)=> d.id);
        
        vehicles.exit().remove();
        
        let vehicleGroup = vehicles.enter()
            .append("g")
            .attr("class", d => (`vehicles route-${d.routeTag}`));//class name can't start with numbers
        
        vehicleGroup
            .append("circle")
            .attr("id", d => d.id)
            .attr("r", "3px")
            .attr("cx", d => projection([d.lon,d.lat])[0])
            .attr("cy", d => projection([d.lon,d.lat])[1])
            .style("fill", d => `#${this.state.routeColor.get(d.routeTag).toString()}`);
        
        vehicleGroup.append("svg:title")
            .text(d => `RouteTag: ${d.routeTag}\nVehicle ID: ${d.id}`);
        
        d3.selectAll(".vehicles").select("circle").transition().duration(500)
            .attr("cx", d => projection([d.lon,d.lat])[0])
            .attr("cy", d => projection([d.lon,d.lat])[1]); 
        
        if(this.state.ifLineEnabled){
            this.renderTrack(this.state.lineData)
        }
    }

    renderTrack = (trackData) => {
        let svg = d3.select(this.svgNode)
        let lineArr = Array.from(trackData)
        let line = d3.line();
        let vehicleTrack = svg.selectAll(".track")
            .data(lineArr,d => d[0])
            .attr("d", d => line(d[1].data));

        vehicleTrack.exit().remove()    
        vehicleTrack.enter().append("path")
            .attr("class",d =>`track route-${d[1].routeTag}`)
            .attr("d", d => line(d[1].data))
            .style("stroke", d => `#${this.state.routeColor.get(d[1].routeTag).toString()}`)
            .style("stroke-width", "1px")
            .style("fill-opacity",0)
            .attr("visibility","hidden");

        svg.selectAll(`.route-${this.state.checkedBoxes.join(', .route-')}`).attr("visibility","visible");

    }

    handleRouteFilter = (checkedBoxes) => {
        let checkBoxArr = [...checkedBoxes]
        this.setState({
            checkedBoxes:checkBoxArr
        })
        let svg = d3.select(this.svgNode)
        svg.selectAll(".vehicles, .track").attr("visibility","hidden");
        svg.selectAll(`.route-${checkBoxArr.join(', .route-')}`).attr("visibility","visible");
    }

    handleClearLine = (e) => {
        d3.selectAll(".track").remove()
        this.setState({
            lineData: new Map()
        })
    }

    toggleLineDisplay = () => {
        if(this.state.ifLineEnabled){
            d3.selectAll(".track").remove()
            this.setState({
                lineData: new Map(),
                ifLineEnabled:false
            })
        }else{
            this.setState({
                ifLineEnabled:true
            })
        }
    }

    render() {
        const {width,height} = this.props
        const enableLine = this.state.ifLineEnabled ? "Disable Track-line" : "Enable Track-line"
        return (
            <div className="App">
                <Checklist onCheckedBoxes={this.handleRouteFilter}  />
                <button className="btn btn-default" onClick={this.toggleLineDisplay}>{enableLine}</button>
                <button className="btn btn-default" onClick={this.handleClearLine}> Clear Track-line</button><br/>
                <svg ref={svgNode => this.svgNode = svgNode} width={width} height={height} />
            </div>
        );
    }
  }
  
  export default SFMap;
  
