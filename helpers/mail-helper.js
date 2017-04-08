var mailHelper = {};
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require("fs"));
var nodemailer = Promise.promisifyAll(require("nodemailer"));
var EmailTemplate = require('email-templates').EmailTemplate
var config = require('../config');

var templates = new EmailTemplate(path.join(__dirname, '..', config.mails.signup.path));

var transporter = null;
var senderMail = null;

mailHelper.init = function () {
    senderMail = config.smtp.sender_name;

    var smtpConfig = {
        service: config.smtp.service,
        auth: {
            user: config.smtp.username,
            pass: config.smtp.password
        }
    };
    transporter = nodemailer.createTransport(smtpConfig);
    transporter.verify(function(err) {
        if (err) {
            console.log('Errore connessione a ' + config.smtp.host + ':' + config.smtp.port ,err);
        } else {
            console.log('Connessione a ' + (config.smtp.service || (config.smtp.host + ':' + config.smtp.port)) + ' riuscita');
        }
    });
};

mailHelper.sendSignUp = function (username, password, recipient, token) {
    var data = {username: username, password: password, url: config.host.http_baseurl + '/validate?token=' + token};
    return templates.render(data).then(function (result) {
        return mailHelper.sendTemplateMail(result.html, config.mails.signup.subject, recipient);
    }).catch(function (err) {
         return err;
    });
};

mailHelper.sendTemplateMail = function (template, subject, recipient) {
    var mail = {
        from: senderMail,
        to: recipient,
        subject: subject,
        html: template
    };
    return mailHelper.sendMail(mail);
};

mailHelper.sendMail = function (mail) {
    return transporter.sendMail(mail).then(function (mailResponse) {
        return mailResponse;
    });
};

module.exports = mailHelper;