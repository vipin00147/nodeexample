const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/employee')
const con = mongoose.connection

const schema = new mongoose.Schema({
    name : String,
    phone : String,
    email : String,
    job_title : String,
    password : String
})

const Model = mongoose.model('users', schema)

con.on('connected',function() {
    console.log("DB connected....")
})

con.on('disconnected',function() {
    console.log("DB Disconnected....")
})

con.on('error', console.error.bind(console, 'connection error : '))

module.exports.insertData = function insertData(name, phone, email, job_title, password) {
    const doc = new Model({
        name : name,
        phone : phone,
        email : email,
        job_title : job_title,
        password : password
    })

    con.on('open',function() {
        doc.save(function(err, res) {
            if(err) {
                throw err
            }
            
            con.close()
            return res
        })
    })
}