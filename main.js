const express = require('express')
const bodyParser = require('body-parser')
const mw = require("./middleware")
const data = require("./user_data")
const database = require('./database')
const app = express()
const login_success = {message : "Login success."}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.listen(3000, () => {
    console.log("Server listening at http://localhost:3000/")
})

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

app.post("/add_user", mw.validateAddUserCredential(), (req, res) => {
    database.insertData(req.body.name,req.body.phone, req.body.email, req.body.job_title, req.body.password, res)
})

app.get('/get_users', (req, res) => {
    database.getUsers(res)
})

app.post('/delete_user', (req, res) => {
   database.deleteUsers(req.body.user_id, res)
})