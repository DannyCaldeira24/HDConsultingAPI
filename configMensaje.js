var nodemailer = require('nodemailer');
var path = require('path');
module.exports = (formulario) => {

    var hbs = require('nodemailer-express-handlebars'),
        email = process.env.MAILER_EMAIL_ID || 'hdconsultingweb@gmail.com',
        pass = process.env.MAILER_PASSWORD || 'gqvdrztdkusvugxd';

    var smtpTransport = nodemailer.createTransport({
        service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
        auth: {
            user: email,
            pass: pass
        }
    });

    var handlebarsOptions = {
        viewEngine: {
            extname: '.html',
            layoutsDir: 'templates/email/',
            partialsDir: 'templates/partials/'
        },
        viewPath: path.resolve('./templates/email/'),
        extName: '.html'
    };
    smtpTransport.use('compile', hbs(handlebarsOptions));

    var data = {
        to: 'hdconsultingweb@gmail.com',
        from: 'hdconsultingweb@gmail.com',
        template: 'contact-email',
        subject: 'Client Contact - HDConsulting',
        context: {
            email: formulario.email,
            subject: formulario.subject
        }
    };

    smtpTransport.sendMail(data, function (err) {
        if (err)
            console.log(err)
    });
}