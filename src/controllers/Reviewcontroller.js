//bookId:{ObjectId,mandatory, refs to book model},reviewedBy:{string mandatory,default 'Guest'},
//reviewedAt: {Date, mandatory},rating: {number, min 1, max 5, mandatory},review: {string, optional}
//isDeleted: {boolean, default: false}

const bookModel = require('../models/bookModel')
const reviewModel = require('../models/reviewModel')
const mongoose = require('mongoose')

// Add a review for the book in reviews collection.
// Check if the bookId exists and is not deleted before adding the review.
// Get review details like review, rating, reviewer's name in request body.
// Update the related book document by increasing its review count
// Return the updated book document with reviews data on successful operation.

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}
const isValidrequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

//POST /books/:bookId/review
const createReview = async function(req, res){
    try{
        const requestBody = req.body
        const bookId = req.params.bookId
        if(!isValidObjectId(bookId)){
            res.status(400).send({status: false, message: `${bookId} this is not valid book id please! check`})
            return
        }
        if (!isValidrequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'request body is not found' })
        }
        const {rating, reviewedBy, reviewedAt} = requestBody
        const book = await bookModel.findOne({_id:bookId, isDeleted:false})
        if(!book){
         return res.status(404).send({status:false, message:'book not found'})   
        }
        if (!isValid(rating)) {
            res.status(400).send({ status: false, message: 'rating required' })
            return
        }
        if (!((rating > 0) && (rating < 6))) {
            res.status(400).send({ status: false, message: 'rating is not in required range' })
            return
        }
        if (!isValid(reviewedBy)) {
            res.status(400).send({ status: false, message: `reviewer's name is required` })
            return
        }
        if (!isValid(reviewedAt)) {
            res.status(400).send({ status: false, message: `reviewedAt is required` })
            return
        }
        const review = {rating, reviewedBy, reviewedAt, bookId}
        const data = await reviewModel.create(review)
        
        await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { "reviews": 1 } }, { new: true })
        
        return res.status(200).send({ status: true, message: 'Review created succesfully', data: data })
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
} 

// Update the review - review, rating, reviewer's name.
// Check if the bookId exists and is not deleted before updating the review. 
// Check if the review exist before updating the review. 
// Get review details like review, rating, reviewer's name in request body.

//PUT /books/:bookId/review/:reviewId

const updateReview = async function(req,res){
    try{
        const requestBody = req.body
        const bookId = req.params.bookId
        const reviewId = req.params.reviewId
        if (!isValidrequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'request body not found' })
        }
        const {rating, reviews, reviewedBy} = requestBody
        if(!isValidObjectId(bookId)){
            res.status(400).send({status: false, message: `${bookId} is not valid book id`})
            return
        }
        if(!isValidObjectId(reviewId)){
            res.status(400).send({status: false, message: `${reviewId} is not valid review id`})
            return
        }
        const book = await bookModel.findOne({_id:bookId, isDeleted:false})
        if(!book){
            return res.status(404).send({status:false, message:'book not found'})
        }
        const review = await reviewModel.findOne({_id:reviewId, isDeleted:false})
            if(!review){
                return res.status(404).send({status:false, message:'reivew not found'})
            }
        if (!(rating > 0 && rating < 6)) {
            res.status(400).send({ status: false, message: "rating must be 1 to 5" });
            return;
        }
        const update = await reviewModel.findOneAndUpdate({_id:review.Id},{ reviews,rating,reviewedBy},{new:true});
        if(!update){
            return res.status(400).send({status:false, message:'review not found'})
        }
        return res.status(200).send({status:true, message:'review updaetd successfully',data:update})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

//Check if the review exist with the reviewId. Check if the book exist with the bookId. 
//Delete the related reivew.Update the books document - decrease review count by one

//DELETE /books/:bookId/review/:reviewId
const deleteReview = async function(req,res){
    try{
        const bookId = req.params.bookId
        const reviewId= req.params.reviewId
        if(!isValidObjectId(bookId)){
            res.status(400).send({status: false, message: `${bookId} is not valid book id`})
            return
        }
        if(!isValidObjectId(reviewId)){
            res.status(400).send({status: false, message: `${reviewId} is not valid review id`})
            return
        }
        const review = await reviewModel.findOne({_id:reviewId, isDeleted:false})
        if(!review){
            return res.status(404).send({status:false, message:'review not found'})
        }    
        const book = await reviewModel.findOne({_id:bookId, isDeleted:false})
        if(!book){
            return res.status(404).send({status:false, message:'review not found'})
        }    
        const del = await reviewModel.findOneAndUpdate({_id:reviewId._id,bookId:book._id,isDeleted:false},
            {isDeleted:true})
        if(!del){
            return res.status(404).send({status:false, message:'data not found'})
        }
        await bookModel.findOneAndUpdate({_id:book._id, isDeleted:false}, {$inc:{reviews: -1}})
        return res.status(200).send({status:true, message:'review deleted successfully', data:del})
    }    
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

module.exports = {createReview, updateReview, deleteReview}