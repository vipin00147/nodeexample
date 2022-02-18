const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/employee',{useMongoClient: true})
const con = mongoose.connection

const userSchema = new mongoose.Schema({
    id : String,
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

const otpSchema = new mongoose.Schema({
    email : String,
    otp : String
})

const attachmentSchema = new mongoose.Schema({
    job_id : String,
    attachment : String
})

const commentSchema = new mongoose.Schema({
    job_id : String,
    msg : String,
    commented_by : {},
    commented_at : String
})

const orderHistorySchema = new mongoose.Schema({
    job_id : String,
    order_history_msg : String,
})

const orderSchema = new mongoose.Schema({
    job_title : { type: String, required : true },
    customer_name : { type: String, required : true },
    phone_number : String,
    description : String,
    status : { type: String, required : true },
    created_by : {},
    created_at : String
})

const deliverySchema = new mongoose.Schema({
    job_title : { type: String, required : true },
    customer_name : { type: String, required : true },
    phone_number : String,
    delivery_address : String,
    delivery_date : String,
    delivery_time : String,
    description : String,
    driver : {},
    driver_name : String,
    driver_phone : String,
    status : { type: String, required : true },
    created_by : {},
    attachments : [],
    delivery_history : [],
    comments : [],
    created_at : String
})


const userCollection = mongoose.model('users', userSchema)
const tokenCollection = mongoose.model('tokens', tokenSchema)
const otpCollection = mongoose.model('otp', otpSchema)
const orderCollection = mongoose.model('orders', orderSchema)
const deliveryCollection = mongoose.model('delivery', deliverySchema)
const attachmentCollection = mongoose.model('attachments', attachmentSchema)
const commentCollection = mongoose.model('comments', commentSchema)
const orderHistoryCollection = mongoose.model('order_history', orderHistorySchema)

con.on('open',function() {})

con.on('connected',function() {
    console.log("DB connected....")
})

con.on('disconnected',function() {
    console.log("DB Disconnected....")
})

con.on('error', console.error.bind(console, 'connection error : '))

module.exports = {userCollection, tokenCollection, otpCollection, orderCollection, attachmentCollection,
     commentCollection, orderHistoryCollection, deliveryCollection}