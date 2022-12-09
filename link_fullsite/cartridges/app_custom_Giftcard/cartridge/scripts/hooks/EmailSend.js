 function SendMailFunction(to,from,subject,content) {
    var Mail = require('dw/net/Mail');
    var mail=new Mail();
    mail.addTo(to);
    mail.setFrom(from);
    mail.setSubject(subject);
    mail.setContent(content,"text/html","UTF-8");
    var status= mail.send();
    if (status.getMessage()=='OK') {
      return true;
    }
    else{
       return false;
    }
 }
 module.exports = {
    SendMailFunction: SendMailFunction
 };
