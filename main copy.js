const express = require('express')
const bodyParser = require('body-parser')
const mw = require("./middleware")
const data = require("./user_data")
const app = express()
const login_success = {message : "Login success."}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.post("/login", mw.validateLoginCredential(), (req, res) => {

    let isValidUser = false

    data.userData.forEach(function(data) {
        if(data.email === req.body.email) {
            isValidUser = true
            if(data.password != req.body.password) {
                res.status(401)
                res.send({message : "Wrong Password"})
            }
            else {
                res.status(200)
                res.send(data)
            }
        }
    });


    if(!isValidUser) {
        res.send(404, {message : "User not found."})
    }
})

app.listen(8000, () => {
    console.log("Server listening at http://localhost:8000/")
})