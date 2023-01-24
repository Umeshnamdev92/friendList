'use strict';

var Mail = require('dw/net/Mail');

/**
 * Hooks for sending Emails for respective query section one by one
 * @function
 */
function sendEmail(emailObj) {
  var status;
  var mail = new Mail();
  mail.addTo(emailObj.mailSubject);
  mail.setFrom(emailObj.customerEmail);
  mail.setSubject(emailObj.subject);
  mail.setContent(emailObj.queryText);
  status = mail.send();
  if (status.getMessage() !== 'OK') {
    return false;
  }
  else{
    return true;
  }
  
}

module.exports = {
  sendEmail: sendEmail
};
