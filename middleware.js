module.exports.validateLoginCredential = function() {
    return function(req, res, next) {
        console.log(req.body)
        if(req.body.email === '' && req.body.password === '') {
            res.status(400).send({message : "Email and password required."})
        }
        else if(req.body.email === '') {
            res.status(400).send({message : "Email field can't be empty."})
        }
        else if(!isvalidEmail(req.body.email)) {
            res.status(400).send({message : "Invalid email."} )
        }
        else if(req.body.password === '') {
            res.status(400).send({message : "password field can't be empty."} )
        }
        else if(req.body.password.length < 8) {
            res.status(400).send({message : "Password length should be more then 8."} )
        }
        else {
            next()
        }
    }
}

function isvalidEmail(email) {
    var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/

    if (!email)
        return false;

    if(email.length>254)
        return false;

    var valid = emailRegex.test(email);
    if(!valid)
        return false;

    // Further checking of some things regex can't handle
    var parts = email.split("@");
    if(parts[0].length>64)
        return false;

    var domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;

    return true;
}

module.exports.validateAddUserCredential = function() {
    return function(req, res, next) {
        
        if(req.body.name === '') {
            res.status(400).send({message : 'Name field cant be empty.'})
        }
        else if(req.body.phone === '') {
            res.status(400).send({message : 'Phone field cant be empty.'})
        }
        else if(req.body.email === '') {
            res.status(400).send({message : 'Email field cant be empty.'})
        }
        else if(req.body.job_title === '') {
            res.status(400).send({message : 'Job title field cant be empty.'})
        }
        else if(req.body.password === '') {
            res.status(400).send({message : 'Password field cant be empty.'})
        }
        else if(!isvalidEmail(req.body.email)) {
            res.status(400).send({message : "Invalid email."} )
        }
        else if(req.body.password.length < 8) {
            res.status(400).send({message : "Password length should be more then 8."} )
        }
        else {
            next()
        }
    }
}