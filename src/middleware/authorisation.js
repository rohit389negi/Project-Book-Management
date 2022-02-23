const jwt = require('jsonwebtoken')

const authorise = async function(req, res, next){
    try{
        const decodedToken = req.header('x-api-key')
        if(!decodedToken){
            return res.status(401).send({status:false, message:'token is missing'})
         } 
        const token = jwt.verify(decodedToken, 'asecretkey')
        if(!token){
            return res.status(401).send({status:false, message:'token not found'})
        }
        req.user = token
        next()
    }
    catch(err){
        return res.status(500).send({status:false, message: err.message})
    }
}

module.exports = {authorise}
