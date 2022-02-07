const req = require('express/lib/request')
const res = require('express/lib/response')
const multer  = require('multer')
const path = require('path')
var util = require('util');
const profile_dest = multer({ dest: './profile_pictures' })
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/employee',{useMongoClient: true})
const con = mongoose.connection

//profile image storag epath
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

const userSchema = new mongoose.Schema({
    name : String,
    phone : String,
    email : String,
    job_title : String,
    password : String,
    profile_picture : String
})

const userCollection = mongoose.model('users', userSchema)

con.on('open',function() {})

con.on('connected',function() {
    console.log("DB connected....")
})

con.on('disconnected',function() {
    console.log("DB Disconnected....")
})

con.on('error', console.error.bind(console, 'connection error : '))

//check login credential
module.exports.checkLoginCredential = function(user_email, user_pass, response) {
    userCollection.find({email : user_email}, function(err, userData) {

        if(userData.length == 0)
            response.status(400).send({message : "User not found."})
        else{
            if(userData[0].password == user_pass) 
                response.status(200).send(userData[0])
            else
                response.status(400).send({message : "Wrong password."}) 
        }    
    })
}

//Create New User
module.exports.insertData = function insertData(req, response) {
    
    //imageUpload.single('profile_picture')

    const doc = new userCollection({
        name : req.body.name,
        phone : req.body.phone,
        email : req.body.email,
        job_title : req.body.job_title,
        password : req.body.password,
        profile_picture : "path"
    })

    userCollection.find({email : req.body.email},function(err, data) { 
        if(err) {
            throw err
        }

        if(data.length == 0){

            doc.save(function(err, res) {
                if(err) {
                    throw err
                }
                response.status(200).send(res)
            })
        }
        else {
            response.status(200).send({message: "User already exists."})
        }        
    })
}

//Get All Users
module.exports.getUsers = function(response) {

    userCollection.find({}, function(err, users) {
        if(err) {
            throw err
        }
        response.status(200).send({data: users})
    })
}

//delete users 
module.exports.deleteUsers = function(user_id, res) {
    userCollection.deleteOne({_id: user_id }, function(err, data) {

        if(err) 
            res.status(404).send({message:"User not found."})
        else{
            if(data.result.n == 0)
                res.status(400).send({message : "User not found."})
            else
                res.status(200).send({message: "User Deleted Successfully."})
        }    
    });
}

//Update user
module.exports.updateUser = function(reqBody, response) {

    userCollection.find({email : reqBody.email},function(err, data) { 
        if(err) {
            throw err
        }

        if(data.length == 0){
            //Update user here.
            userCollection.updateOne({ _id : reqBody._id }, {$set : { name : reqBody.name,  email : reqBody.email, phone : reqBody.phone, job_title : reqBody.job_title}}, function(err, data) {
                userCollection.find({_id : reqBody._id}, function(err, users) {
                    if(err) {
                        throw err
                    }
                    response.status(200).send(users)
                })
            })
        }
        else {
            response.status(200).send({message: "Email already exists."})
        }        
    })
}