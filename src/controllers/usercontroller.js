//title:{string,mandatory,enum[Mr, Mrs, Miss]},name:{string,mandatory},phone:{string,mandatory,unique},
//email:{string,mandatory,valid email,unique},password:{string,mandatory,minLen 8,maxLen 15},

const userModel = require("../models/userModel.js")
const jwt = require("jsonwebtoken")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) !== -1
}
const isValidEmail = function(value){
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value.trim()))
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length !== 0
}
const isValidPhone = function (str) {
    return (/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(str)) 
}

//Create a user document from request body.
//POST /register
const createUser = async function(req,res){
    try{
        const requestBody = req.body
        if(!isValidRequestBody(requestBody)){
            res.status(400).send({ status: false, message: 'value in request body is required' })
            return
        }
        const {title, name, phone, email, password } = requestBody
        if(!isValid(title)){
            res.status(400).send({ status: false, message: 'title is required' })
            return
        }
        if(!isValidTitle(title.trim())){
            res.status(400).send({ status: false, message: 'title is not valid provid among mr,miss,mrs' })
            return
        }
        if(!isValid(name)){
            res.status(400).send({ status: false, message: 'name is not valid' })
            return
        }
        if(!isValid(phone)){
            res.status(400).send({ status: false, message: 'phone is not valid' })
            return
        }
        if(!isValidPhone(phone)){
            return res.status(400).send({ status: false, msg: "The phone no. is not valid" })
        }
        if(!isValid(email)){
            res.status(400).send({ status: false, message: 'Please provide valid email' })
            return
        }
        if(!isValidEmail(email)){
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if(!isValid(password)){
            res.status(400).send({ status: false, message: 'password is required' })
            return
        }
        if (!((password.length > 7) && (password.length < 16))) {
            return res.status(400).send({ status: false, message: `Password length should be between 8 and 15.` })
        }
        const isNumberAlreadyUsed = await userModel.findOne({ phone });
        if (isNumberAlreadyUsed) {
            res.status(400).send({ status: false, message: `${phone} phone is already registered` })
            return
        }
        const isEmailAlreadyUsed = await userModel.findOne({ email });
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${email.trim()} email is already registered` })
            return
        }
        const user = {title, name, phone, email, password}
        const data = await userModel.create(user)
        return res.status(201).send({status:true, message:'user id created sucessfully', data:data})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

//Allow an user to login with their email and password.
//On a successful login attempt return a JWT token contatining the userId, exp, iat. 

//POST /login
const login = async function(req,res){
    try{
        const requestBody = req.body
        if(!isValidRequestBody(requestBody)){
            res.status(400).send({ status: false, message: 'value in request body is required' })
            return
        }
        const {email, password} = requestBody
        if(!isValid(email)){
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide valid email' })
            return
        }
        if(!isValidEmail(email)){
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if(!isValid(password)){
            res.status(400).send({ status: false, message: 'password must be present' })
            return
        }
        if (!((password.length > 7) && (password.length < 16))) {
            return res.status(400).send({ status: false, message: `Password length should be between 8 and 15.` })
        }
        const user = await userModel.findOne({email, password})
        if(!user){
            return res.status(404).send({status:false, message:'user not found'})
        }
        const token = jwt.sign({userId : user._id}, 'asecretkey')
        res.header('x-api-key', token)
        return res.status(200).send({status:true, mesaage:'user logged in successfully', token:token })
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

module.exports = {createUser, login}

















