const express = require('express')
const bodyParser = require('body-parser')
const mw = require("./middleware")
const database = require('./database')
const multer  = require('multer')
var jwt = require('jsonwebtoken');
const path = require('path')
const app = express()
const login_success = {message : "Login success."}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.listen(3000, () => {
    console.log("Server listening at http://localhost:3000/")
})

if(typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

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

const attachmentsStorage = multer.diskStorage({
    // Destination to store image     
    destination: './attachments', 
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

const attachment_upload = multer({
    storage: attachmentsStorage
})

function checkLoginStatus(req, res, next) {
    try {
        myToken = localStorage.getItem(req.headers.authorization)
        jwt.verify(myToken, 'loginToken')
        next()
    }
    catch(exception) {
        res.status(401).send({message : 'Session expired.'})
    }  
}

app.post("/login", mw.validateLoginCredential(), (req, res) => {
    database.checkLoginCredential(req.body.email, req.body.password,res)
})

app.post("/add_user", checkLoginStatus, imageUpload.single('profile_picture'), mw.validateAddUserCredential(), (req, res) => {
    database.insertData(req, res)
})

app.get('/get_users', checkLoginStatus, (req, res) => {
    database.getUsers(res)
})

app.delete('/delete_user', checkLoginStatus, (req, res) => {
   database.deleteUsers(req.body.user_id, res)
})

app.patch('/update_user', checkLoginStatus, mw.checkDataForUpdation(), (req, res) => {
    database.updateUser(req.body, res)
})

app.post('/add_image', (req, res) => {
    res.send(req.file)
})

app.get('/get_profile', checkLoginStatus, (req, res) => {
    database.getUserProfile(req, res)
})

app.post("/logout", (req, res) => {
    localStorage.removeItem(req.headers.authorization)
    res.status(401).send({message : 'Logout successfully.'})
})

app.post('/forgot_password', (req, res)=> {
    database.forgotPassword(req, res)
})

app.post('/verify_otp', (req, res) => {
    database.verifyOtp(req, res)
})

app.post('/change_password', (req, res) => {
    database.changePassword(req, res)
})

app.post('/create_new_order', checkLoginStatus, (req, res) => {
    database.createNewOrder(req, res)
})

app.post('/upload_attachment', checkLoginStatus, attachment_upload.single('attachment'), (req, res) => {
    database.uploadAttachment(req, res)
})

app.post('/upload_comment', checkLoginStatus, (req, res) => {
    database.uploadComment(req, res)
})

app.post("/set_data", (req, res) => {
    database.getRowData(req, res)
})