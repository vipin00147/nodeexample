const e = require('express')
var nodemailer = require('nodemailer')

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vipin00147@gmail.com',
    pass: 'Vipin@2291'
  }
})

module.exports.sendOtp = function(email, otp, res) {

    var mailOptions = {
        from: 'vipin00147@gmail.com',
        to: email,
        subject: 'OTP for password reset',
        text: 'Here is your OTP for password reset.\n'+otp
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.status(400).send({message:'OTP sending failed.'})
        } else {
            res.status(200).send({message:'OTP sent successfully.'})
        }
    }) 
}