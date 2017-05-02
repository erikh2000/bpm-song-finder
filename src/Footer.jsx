import React from 'react';
import { Well } from 'react-bootstrap';

const Footer = () => (
  <Well bsSize='small' className='footer'>
    <span className='footer-long-text'>Cheerfully written by <a href='https://github.com/erikh2000'>Erik Hermansen</a>. Data from <a href='http://spotify.com'>Spotify</a>.</span>
    <span className='footer-short-text'>By <a href='https://github.com/erikh2000'>Erik Hermansen</a>. Data from <a href='http://spotify.com'>Spotify</a>.</span>
    <a href='http://seespacelabs.com'><span className='footer-logo' /></a>
  </Well>
);

export default Footer;
