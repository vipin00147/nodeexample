const express = require('express')
const bodyParser = require('body-parser')
const mw = require("./middleware")
const database = require('./database')
const req = require('express/lib/request')
const multer  = require('multer')
const path = require('path')
const app = express()
const login_success = {message : "Login success."}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.listen(3000, () => {
    console.log("Server listening at http://localhost:3000/")
})

const imageStorage = multer.diskStorage({
    // Destination to store image     
    destination: './profile_pictures', 
      filename: (req, file, cb) => {
          cb(null, file.fieldname + '_' + Date.now() 
             + path.extname(file.originalname))
            // file.fieldname is name of the field (image)
            // path.extname get the uploaded file extension
    }
});

const imageUpload = multer({
    storage: imageStorage,
}) 

app.post("/login", mw.validateLoginCredential(), (req, res) => {
    database.checkLoginCredential(req.body.email, req.body.password,res)
})

app.post("/add_user", mw.validateAddUserCredential(), (req, res) => {
    database.insertData(req, res)
})

app.get('/get_users', (req, res) => {
    database.getUsers(res)
})

app.delete('/delete_user', (req, res) => {
   database.deleteUsers(req.body.user_id, res)
})

app.patch('/update_user', mw.checkDataForUpdation(), (req, res) => {
    database.updateUser(req.body, res)
})

app.post('/add_image', imageUpload.single('uploaded_file'), (req, res) => {
    res.send(req.file)
    Request
})