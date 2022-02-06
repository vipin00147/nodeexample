const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/employee',{useMongoClient: true})
const con = mongoose.connection

const userSchema = new mongoose.Schema({
    name : String,
    phone : String,
    email : String,
    job_title : String,
    password : String
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

//Create New User
module.exports.insertData = function insertData(name, phone, userEmail, job_title, password, response) {

    const doc = new userCollection({
        name : name,
        phone : phone,
        email : userEmail,
        job_title : job_title,
        password : password
    })

    Model.find({email : userEmail},function(err, data) { 
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

    Model.find({}, function(err, users) {
        if(err) {
            throw err
        }
        response.status(200).send({data: users})
    })
}

//delete users 
module.exports.deleteUsers = function(user_id, res) {
    userCollection.deleteOne({_id: user_id }, function(err) {
        if(err) 
            res.status(404).send({message:"User not found."})
        else
            res.status(200).send({message: "User Deleted Successfullt."})
    });
}