module.exports.validateLoginCredential = function() {
    return function(req, res, next) {
        if(req.body.email === '' && req.body.password === '') {
            res.send(401, {message : "Email and password required."})
        }
        else if(req.body.email === '') {
            res.send(401, {message : "Email field can't be empty."})
        }
        else if(!isvalidEmail(req.body.email)) {
            res.send(401, {message : "Invalid email."} )
        }
        else if(req.body.password === '') {
            res.send(401, {message : "password field can't be empty."} )
        }
        else if(req.body.password.length < 8) {
            res.send(401, {message : "Password length should be more then 8."} )
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
            res.send(401, 'Name field cant be empty.')
        }
        else if(req.body.phone === '') {
            res.send(401, 'Phone field cant be empty.')
        }
        else if(req.body.email === '') {
            res.send(401, 'Email field cant be empty.')
        }
        else if(req.body.job_title === '') {
            res.send(401, 'Job title field cant be empty.')
        }
        else if(req.body.password === '') {
            res.send(401, 'Password field cant be empty.')
        }
        else if(!isvalidEmail(req.body.email)) {
            res.send(401, {message : "Invalid email."} )
        }
        else if(req.body.password.length < 8) {
            res.send(401, {message : "Password length should be more then 8."} )
        }
        else {
            next()
        }
    }
}
