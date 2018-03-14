import React from "react"
import "./SFMap.css"

class Checkbox extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            isChecked:true
        }
    }
    // receiving new props(ifCheckedAll) from parent state update
    componentWillReceiveProps(nextProps){
        if (nextProps.ifCheckedAll !== this.props.ifCheckedAll){
            if(nextProps.ifCheckedAll){
                this.checkAll(true)
            }else{
                this.checkAll(false)
            }
        }
    }

    toggleCheckbox = () => {
        const label = this.props.label;
        this.setState({ 
            isChecked: !this.state.isChecked
        })
        //lift state up
        this.props.handleCheckboxChange(label);
    }

    checkAll = (ifCheckedAll) => {
        const label = this.props.label;
        this.setState({ 
            isChecked: ifCheckedAll
        })
        //lift state up
        this.props.handleCheckAll(label);
    }
    
    render(){
        const { label,color } = this.props;
        const { isChecked } = this.state;
        const boxStyle = {
            color:`#`+color
        }
        return (
            <div className="checkbox">
              
                <input
                    className="inputBox"
                    type="checkbox"
                    value={label}
                    checked={isChecked}
                    onChange={this.toggleCheckbox}
                /> 
                <label style={boxStyle}>     
                    {label}
                </label>
                
            </div>
          );
    }
}
export default Checkbox