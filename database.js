const req = require('express/lib/request')
const res = require('express/lib/response')
const bcrypt = require("bcrypt")
const multer  = require('multer')
const path = require('path')
var util = require('util')
var jwt = require('jsonwebtoken');
const profile_dest = multer({ dest: './profile_pictures' })
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/employee',{useMongoClient: true})
const con = mongoose.connection

const userSchema = new mongoose.Schema({
    name : String,
    phone : String,
    email : String,
    job_title : String,
    profile_picture : String,
    password : String
})

const tokenSchema = new mongoose.Schema({
    email : String,
    token : String
})

const userCollection = mongoose.model('users', userSchema)
const tokenCollection = mongoose.model('tokens', tokenSchema)

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
            // decrypt password
            bcrypt.compare(user_pass, userData[0].password, function(err, isMatched) {
                if(err) throw err
                if(isMatched) {

                    tokenCollection.find({email : user_email}, function(err,tokenModel) {
                        if(err) console.log(err.message)
                        localStorage.removeItem(tokenModel[0]._doc.token)     
                    })

                    var token = jwt.sign({ foo: 'bar' }, 'loginToken')
                    localStorage.setItem(token, token)    
                    let signInData = Object.assign(userData[0]._doc, {token :localStorage.getItem(token) })
                    tokenCollection.updateOne({email :user_email },{$set : {token : localStorage.getItem(token)}})
                    
                    response.status(200).send(signInData)

                    const doc = new tokenCollection({
                        email : user_email,
                        token : localStorage.getItem(token)
                    })

                    tokenCollection.find({email : user_email}, function(err,tokenModel) {
                        console.log("length : "+tokenModel)
                        if(tokenModel.length == 0) {
                            doc.save()
                        }
                        else {
                            tokenCollection.updateOne({email : user_email},{set : {token : localStorage.getItem(token)}})
                        }
                    })
                }
                    
                else
                    response.status(400).send({message : "Wrong password."}) 
            });
        }    
    })
}

//Create New User
module.exports.insertData = function insertData(req, response) {
   
    //encrypt Password.........
    bcrypt.hash(req.body.password, 10, function(hashError, hash) {
        if (hashError) {
          throw hashError
        } else {
            const doc = new userCollection({
                name : req.body.name,
                phone : req.body.phone,
                email : req.body.email,
                job_title : req.body.job_title,
                profile_picture : req.file.path,
                password : hash
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

//Get User Profile

module.exports.getUserProfile = function(request, response) {
    userCollection.find({_id : request.body._id}, function(err, userData) {
        if(err) {
            throw err
        }
        response.status(200).send(userData[0])
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