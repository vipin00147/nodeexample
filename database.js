const bcrypt = require("bcrypt")
const multer  = require('multer')
const path = require('path')
var jwt = require('jsonwebtoken');
const mailerModule = require('./mailer/mailer');
const { userCollection, tokenCollection, otpCollection, orderCollection, attachmentCollection, commentCollection, orderHistoryCollection, deliveryCollection } = require("./models/models");
const { Console, clear } = require("console");
const { initializeApp } = require('firebase-admin/app');
var admin = require("firebase-admin");
var serviceAccount = require("./firebase/service_key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://notificationdemo-924b3-default-rtdb.firebaseio.com"
});


//check login credential
module.exports.checkLoginCredential = function(user_email, user_pass, response) {
    userCollection.find({email : user_email},{__v : 0}, function(err, userData) {

        if(userData.length == 0)
            response.status(400).send({message : "User not found."})
        else{
            // decrypt password
            bcrypt.compare(user_pass, userData[0].password, function(err, isMatched) {
                if(err) throw err
                if(isMatched) {

                    tokenCollection.find({email : user_email}, function(err,tokenModel) {
                        if(err) console.log(err.message)
                        if(tokenModel.length != 0)
                            localStorage.removeItem(tokenModel[0]._doc.token)     
                    })

                    var token = jwt.sign({ foo: 'bar' }, 'loginToken')
                    localStorage.setItem(token, token)    
                    let signInData = Object.assign(userData[0]._doc, {token :localStorage.getItem(token) })
                    tokenCollection.updateOne({email :user_email },{$set : {token : localStorage.getItem(token)}})
                    
                    response.status(200).send(signInData)

                    const doc = new tokenCollection({
                        _id : userData[0]._id,
                        email : user_email,
                        token : localStorage.getItem(token)
                    })

                    tokenCollection.find({email : user_email}, function(err,tokenModel) {
                        if(tokenModel.length == 0) {
                            doc.save()
                        }
                        else {
                            tokenCollection.updateOne({ email : user_email }, {$set : { token : localStorage.getItem(token)}}, function(err, data) {
                                tokenCollection.find({email : user_email}, function(err, users) {
                                    if(err) {
                                        throw err
                                    }                                   
                                })
                            })
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

    userCollection.find({},{__v : 0, password : 0}, function(err, users) {
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

//forgot password reset
module.exports.forgotPassword = function(req, res) {
    userCollection.find({email : req.body.email}, function(err, data) {
        if(err) return res.status(400).send({message: err.message})
        else {
            if(data.length != 0) {
                var random_otp = Math.floor(1000 + Math.random() * 9000)

                const doc = new otpCollection({
                    email : req.body.email,
                    otp : random_otp
                })

                otpCollection.find({email : req.body.email}, function(err,otpModel) {
                    if(otpModel.length == 0) {
                        doc.save()
                        mailerModule.sendOtp(req.body.email, random_otp, res) 
                    }
                    else {
                        otpCollection.updateOne({ email : req.body.email }, {$set : { otp : random_otp}}, function(err, data) {
                            mailerModule.sendOtp(req.body.email, random_otp, res)
                        })
                    }
                })
            }
            else {
                res.status(404).send({message: 'User does not exist.'})
            }
        }
    })
}

//verify OTP
module.exports.verifyOtp = function (req, res) {
    otpCollection.find({email : req.body.email}, function(err, otpModel) {
        if(!err) {
            if(otpModel[0]._doc.otp === req.body.otp) {
                res.status(200).send({message : "Verified Success."})
            }
            else {
                res.status(400).send({message : "Invalid OTP."})
            }
        }
    })
}

//change password
module.exports.changePassword = function(req, res) {
    userCollection.find({email : req.body.email}, function(err, userData) {
        if(err) console.log(err)
        if(userData.length != 0) {
            if(req.body.password.length < 8)
                res.status(406).send({message: 'Password length must be between 8 and 15'})
            else if(req.body.password != req.body.conf_password)
                res.status(406).send({message: 'Confirm password should be same as password'})
            else {
                bcrypt.hash(req.body.password, 10, function(hashError, hash) {
                    userCollection.updateOne({ email : req.body.email }, {$set : { password : hash}}, function(err, data) {
                        res.status(200).send({message: 'Password Changed Successfully.'})
                    })
                })
            }
        }
        else {
            res.status(404).send({message: 'User does not exist.'})
        }
    })
}

//create new order
module.exports.createNewOrder = function(req, res) {

    const doc = new orderCollection({
        job_title : req.body.job_title,
        customer_name : req.body.customer_name,
        phone_number : req.body.phone_number,
        description : req.body.description,
        status : req.body.status,
        created_by : null,
        created_at : new Date().toISOString()
    })

    tokenCollection.find({token : req.headers.authorization},function(err, tokenData) {
        userCollection.find({_id : tokenData[0]._id},{_id : 1, name : 1, phone : 1, profile_picture : 1},function(err, userData) {
            doc.created_by = userData[0]
            doc.save(async function(err, savedResponse) {
                if(err) 
                    res.status(400).send({message : err.message})
                else {
                    await orderCollection.find({_id : savedResponse._id},{__v : 0},async function(err, orderData) {
                        jobData = orderData[0]
                    })
                    await orderHistoryCollection.find({job_id : savedResponse._id}, {__v : 0},async function(err, orderHistoryData) {
                        orderHistory = orderHistoryData 
                    })
                    await attachmentCollection.find({job_id : savedResponse._id}, {__v : 0},async function(err, attachmentData) {
                        attachments = attachmentData
                    })
                    await commentCollection.find({job_id : savedResponse._id}, {__v : 0},async function(err, commentData) {
                        comments = commentData
                    })
                
                    let responseData = {jobData, orderHistory, attachments, comments}
                    
                    res.send(responseData)
                }
            })
        })
    })   
}

//create new delivery
module.exports.createNewDelivery = async function(req, res) {

    const doc = await new deliveryCollection({
        job_title : req.body.job_title,
        customer_name : req.body.customer_name,
        phone_number : req.body.phone_number,
        delivery_address : req.body.delivery_address,
        delivery_date : req.body.delivery_date,
        delivery_time : req.body.delivery_time,
        description : req.body.description,
        driver_name : req.body.driver_name,
        driver_phone : req.body.driver_phone,
        status : req.body.status,
        created_by : null,
        driver : null,
        created_at : new Date().toISOString()
    })


    tokenCollection.find({token : req.headers.authorization}, function(err, tokenData) {
        userCollection.find({_id : tokenData[0]._id},{_id : 1, name : 1, phone : 1, profile_picture : 1}, function(err, userData) {
            doc.created_by = userData[0]

            userCollection.find({_id : req.body.driver_id}, {_id : 1, name : 1, phone : 1, profile_picture : 1}, function(err, driverData) {
                if(err) console.log(err.message)
                else if(driverData.length != 0) {
                    doc.driver = driverData[0]  
                }
                              
                doc.save(function(err, savedResponse) {
                    if(err) 
                        res.status(400).send({message : err.message})
                    else
                        deliveryCollection.find({_id : savedResponse._id},{__v : 0}, function(err, deliveryData) {
                        res.status(200).send(deliveryData[0])
                    })
                })
            })
        })
    })
}

//upload attachment
module.exports.uploadAttachment = async function(req, res) {

    //add order history

    const attach_doc = new attachmentCollection({
        job_id : req.body.job_id,
        attachment : req.file.path
    })
    
    
    if(req.body.order_id != '') {
        await updateJobHistory(req, res, "attachment", true)        //update job history.
        attach_doc.job_id = req.body.order_id
    }
    else {
        await updateJobHistory(req, res, "attachment", false)       //update job history.
        attach_doc.job_id = req.body.delivery_id
    }


    //add attachment
    attach_doc.save(function(err, attach_res) {
        if(err) res.status(400).send({message : err.message})
        else {
            res.status(200).send(attach_res)
        }
    })
}

// upload comments
module.exports.uploadComment = async function(req, res) {

    const comment_doc = new commentCollection({
        job_id : req.body.job_id,
        msg : req.body.msg,
        commented_by : {},
        commented_at : new Date().toLocaleString('en-US')
    })

    tokenCollection.find({token : req.headers.authorization}, function(err, tokenData) {
        userCollection.find({_id : tokenData[0]._id},{_id : 1, name : 1, phone : 1, profile_picture : 1}, function(err, userData) {
            comment_doc.commented_by = userData

            comment_doc.save(function(err, comment_res) {
                if(err) res.status(400).send({message : err.message})
                else {
                    res.status(200).send(comment_res)
                }
            })
        })
    })   
}

async function updateJobHistory(req, res, type, isOrder) {

    const doc = new orderHistoryCollection({
        job_id : "",
        order_history_msg : ""
    })

    await tokenCollection.find({token : req.headers.authorization}, async function(err, tokenData) {
        await userCollection.find({_id : tokenData[0]._id}, async function(err, userData) {

            if(isOrder) {
                doc.job_id = req.body.order_id
                await orderCollection.find({_id : req.body.order_id}, async function(err, orderData){
                    if(type === 'attachment') 
                        doc.order_history_msg = "Attachment added "+orderData[0].job_title+" on "+(new Date().toLocaleString('en-US'))+" by "+userData[0].name
                    else if(type === 'updated')
                        doc.order_history_msg = "Order updated "+orderData[0].job_title+" on "+(new Date().toLocaleString('en-US'))+" by "+userData[0].name
                    else if(type === 'attachmentRemoved')
                        doc.order_history_msg = "Attachment removed "+orderData[0].job_title+" on "+(new Date().toLocaleString('en-US'))+" by "+userData[0].name
                    doc.save(async function(err, data) {})
                })
            }
            else {
                doc.job_id = req.body.delivery_id
                await deliveryCollection.find({_id : req.body.delivery_id}, async function(err, deliveryData){

                    if(type === 'attachment') 
                        doc.order_history_msg = "Attachment added "+deliveryData[0].job_title+" on "+(new Date().toLocaleString('en-US'))+" by "+userData[0].name
                    else if(type === 'updated')
                        doc.order_history_msg = "Order updated "+deliveryData[0].job_title+" on "+(new Date().toLocaleString('en-US'))+" by "+userData[0].name
                    else if(type === 'attachmentRemoved')
                        doc.order_history_msg = "Attachment removed "+deliveryData[0].job_title+" on "+(new Date().toLocaleString('en-US'))+" by "+userData[0].name
                    doc.save(async function(err, data) {})
                })
            }            
        })
    })
}

// update order
module.exports.updateOrder = async function(req, res) { 

    var comments, orderHistory, attachments, jobData
    await updateJobHistory(req, res, "updated", true)

    orderCollection.updateOne({_id : req.body.order_id}, {$set : {
        job_title : req.body.job_title,
        description : req.body.description,
        customer_name : req.body.customer_name,
        phone_number : req.body.phone_number,
    }
}, async function(err, data) {
    if(err)
        res.status(400).send({message : err.message})
    else{

        await orderCollection.find({_id : req.body.order_id},{__v : 0},async function(err, orderData) {
            jobData = orderData[0]
        })
        await orderHistoryCollection.find({job_id : req.body.order_id}, {__v : 0, job_id : 0},async function(err, orderHistoryData) {
            orderHistory = orderHistoryData 
        })
        await attachmentCollection.find({job_id : req.body.order_id}, {__v : 0, job_id : 0},async function(err, attachmentData) {
            attachments = attachmentData
        })
        await commentCollection.find({job_id : req.body.order_id}, {__v : 0, job_id : 0},async function(err, commentData) {
            comments = commentData
        })
    
        let responseData = {jobData, orderHistory, attachments, comments}
        
        res.send(responseData)
        }
    })
}

//remove attachment
module.exports.removeAttachment =async function(req, res) {
    // remove attachment from order

    await updateJobHistory(req, res, "attachmentRemoved", true)

    attachmentCollection.findByIdAndRemove(req.body.attachment_id, function(err, success){
        if(err)
            res.status(400).send({message : err.message})
        else{
            if(req.body.order_id != '') {
                attachmentCollection.find({job_id : req.body.order_id}, {__v : 0, job_id : 0}, function(err, attachments) {
                    res.status(200).send({attachments : attachments})
                })
            }
            else {
                attachmentCollection.find({job_id : req.body.delivery_id}, {__v : 0, job_id : 0}, function(err, attachments) {
                    res.status(200).send({attachments : attachments})
                })
            }
            
        }
            
    })
}

//remove comment 
module.exports.removeComment = async function(req, res) {
    
    commentCollection.findByIdAndRemove(req.body.comment_id, function(err, success){
        if(err)
            res.status(400).send({message : err.message})
        else{
            if(req.body.order_id != '') {
                commentCollection.find({job_id : req.body.order_id}, {__v : 0, job_id : 0}, function(err, comments) {
                    res.status(200).send({comments : comments})
                })
            }
            else {
                commentCollection.find({job_id : req.body.delivery_id}, {__v : 0, job_id : 0}, function(err, comments) {
                    res.status(200).send({comments : comments})
                })
            }
        }   
    })
}

//get all jobs 
module.exports.getAllJobs = async function(req, res) {
    if(req.body.is_order) {
        orderCollection.find({}, {__v : 0}, function(err, allOrders) {
            if(err) 
                res.status(400).send({message : err.message})
            else
                res.status(200).send({data : allOrders})
        })
    }
    else {
        deliveryCollection.find({}, {__v : 0}, function(err, allOrders) {
            if(err) 
                res.status(400).send({message : err.message})
            else
                res.status(200).send({data : allOrders})
        })
    }
}

// get job detail
module.exports.getJobDetail = async function(req, res) {
    var comments, orderHistory, attachments, jobData

    if(req.body.isOrder) {
        orderCollection.find({_id : req.body.job_id}, {__v : 0}, function(err, data) {
            jobData = data[0]
        })
    }
    else {
        deliveryCollection.find({_id : req.body.job_id}, {__v : 0}, function(err, data) {
            jobData = data[0]
        })
    }

    await orderHistoryCollection.find({job_id : req.body.job_id}, {__v : 0, job_id : 0},function(err, orderHistoryData) {
        orderHistory = orderHistoryData 
    })
    await attachmentCollection.find({job_id : req.body.job_id}, {__v : 0, job_id : 0}, function(err, attachmentData) {
        attachments = attachmentData
    })
    await commentCollection.find({job_id : req.body.job_id}, {__v : 0, job_id : 0}, function(err, commentData) {
        comments = commentData
    })

    if(jobData != undefined) {
        let responseData = {jobData, orderHistory, attachments, comments}
        res.send(responseData)
    }
    else {
        res.status(404).send({data : {}})
    }  
}

// send push notification
module.exports.sendPushNotification = function(req, res) {
    
    const firebaseToken = req.body.registrationToken
  
    const payload = {
        data: {
            title: 'Node.js Notification Example.',
            message: 'Here is the demo notification.',
        }
    }
      
    const options = {
        priority: 'high',
        timeToLive: 60 * 60 * 24,
    }
        
    admin.messaging().sendToDevice(firebaseToken, payload, options).then( response => {
        res.status(200).send({message : "Notification sent successfully."})
    })
    .catch( error => {
         res.send({message : error.message})
    })
}