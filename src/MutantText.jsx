import React, { Component } from 'react';
import 'seedrandom'; // Overrides Math.random() and adds Math.seedrandom().

function _mutateText(text, randomSeed) {
  Math.seedrandom(randomSeed);
  let ret = '';
  for (let i = 0; i < text.length; ++i) {
    const r = Math.floor(Math.random() * 10);
    const c = text.charAt(i);
    switch(r) {
      case 0: ret += c.toLowerCase(); break;
      case 1: ret += c.toUpperCase(); break;
      case 2: case 3: ret += c + ' '; break;
      case 4: case 5: ret += c + '  '; break;
      case 6: case 7: ret += c + '   '; break;
      default:
        ret += c;
    }
  }
  return ret;
}

class MutantText extends Component {
  constructor() {
    super();
    this.state = {
      frameNo: 0,
      timer: null
    };
    this._doNextFrame = this._doNextFrame.bind(this);
  }

  componentDidMount() {
    const timer = setTimeout(this._doNextFrame, this.props.updateInterval);
    this.setState({timer});
  }

  componentWillUnmount() {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
      this.setState({timer: null});
    }
  }

  render() {
    const mutatedText = _mutateText(this.props.text, this.props.frameNo);
    return <span className={this.props.className}>{mutatedText}</span>;
  }

  _doNextFrame() {
    const frameNo = this.state.frameNo + 1;
    const timer = setTimeout(this._doNextFrame, this.props.updateInterval);
    this.setState({ frameNo, timer });
  }
};

MutantText.defaultProps = {
  updateInterval: 500
};

export default MutantText;
