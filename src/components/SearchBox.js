import React from "react"
import * as d3 from "d3"
import "./SFMap.css"

class SearchBox extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            
        }
    }
    render(){
        return (
            <div>
                <input className="searchBox" list="browsers" name="browser"/>
                <datalist id="browsers">
                    <option value="Internet Explorer"/>
                    <option value="Firefox"/>
                    <option value="Chrome"/>
                    <option value="Opera"/>
                    <option value="Safari"/>
                </datalist>
                <input submit/>
            </div>
        )
    }
}

export default SearchBox