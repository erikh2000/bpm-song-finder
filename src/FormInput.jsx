import React from 'react';
import {
  FormControl,
  HelpBlock
} from 'react-bootstrap';

import { bsSize, getBootstrapSize } from './layout.js';

const FormInput = ({
  controlId,
  helpText,
  onChange,
  onKeyPress,
  placeholder,
  renderSize,
  validationState,
  value
}) => {
  if (getBootstrapSize() === bsSize.XS) {
    return (
      <div className='form-input form-input-xs'>
          <FormControl type='text' value={value} placeholder={helpText}
            onChange={onChange} onKeyPress={onKeyPress}
          />
      </div>
    );
  } else {
    return (
      <div className='form-input'>
          <FormControl type='text' value={value} placeholder={placeholder}
            onChange={onChange} onKeyPress={onKeyPress}
          />
          <HelpBlock>{helpText}</HelpBlock>
      </div>
    );
  }
};

export default FormInput;
