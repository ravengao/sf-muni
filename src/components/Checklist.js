import React from "react"
import Checkbox from "./Checkbox"
import "./SFMap.css"

class Checklist extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            routeList:[],
            ifCheckedAll:true,
            checkedBoxes:new Set()
        }
    }

    componentDidMount(){
        const params = {
            command:"routeList",
            a:"sf-muni"
        }
        const url = new URL("http://webservices.nextbus.com/service/publicJSONFeed")
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

        fetch(url) 
            .then((response) => response.json())
            .then((data) => {
                this.setState({
                    routeList:data.route
                })
            })
            .catch((err) =>{
                console.log(err)
            });
    }

    checkAll = (item) => {
        if(this.state.ifCheckedAll){
            this.state.checkedBoxes.add(item)
        }else{
            this.state.checkedBoxes.delete(item)
        }
    }

    toggleCheckbox = (item) => {
        if (this.state.checkedBoxes.has(item)) {
            this.state.checkedBoxes.delete(item);
        } else {
            this.state.checkedBoxes.add(item);
        }
    }

    createCheckboxes = (items) => (
        items.map((d) => (
            <Checkbox
                color={this.props.routeColor.get(d.tag)}
                label={d.tag}
                handleCheckboxChange={this.toggleCheckbox}
                key={d.tag}
                handleCheckAll={this.checkAll}
                ifCheckedAll={this.state.ifCheckedAll}
            />
        ))
    )

    handleFormSubmit = (e) => {
        //prevent page refreshing
        e.preventDefault();
        for (const checkbox of this.state.checkedBoxes) {
            console.log(checkbox, 'is selected.');
        }        
        // trigger re-render of map points
        // lift states up to the parent component SFMap
        this.props.onCheckedBoxes(this.state.checkedBoxes);
    }
    
    toggleCheckAll = () => {
        this.setState({
            ifCheckedAll:!this.state.ifCheckedAll
        })
    }

    render(){
        const items = this.state.routeList
        const btnText = this.state.ifCheckedAll ? "Uncheck All" : "Check All";
        return(
            <form onSubmit={this.handleFormSubmit}>
                {this.createCheckboxes(items)}<br/>
                <button className="btn btn-default" type="submit"> Apply Filters</button>
                <button className="btn btn-default" onClick={this.toggleCheckAll}> {btnText}</button>
            </form>
        )
    }
}
export default Checklist