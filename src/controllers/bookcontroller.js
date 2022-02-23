// title:{string,mandatory,unique},excerpt:{string,mandatory},userId:{ObjectId,mandatory,refs to user model},
// ISBN:{string,mandatory,unique},category:{string,mandatory},subcategory:{string,mandatory},
// reviews:{number,default:0},deletedAt:{Date, when the document is deleted}, isDeleted:{boolean,default: false},
// releasedAt:{Date,mandatory,format("YYYY-MM-DD")},

const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const reviewModel = require('../models/reviewModel')
const mongoose = require('mongoose')

//Create a book document from request body. Get userId in request body only.
//Make sure the userId is a valid userId by checking the user exist in the users collection.

//POST /books
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};
const isValidrequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};
const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId);
};

const createBook = async function(req,res){
    try{
        const requestBody = req.body
        if (!(req.user === requestBody.userId)) {
            return res.status(400).send({ status: false, message: "token id or user id not matched" });
        }
        if (!isValidrequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "request body is not found" });
        }
        const {title, excerpt, userId, ISBN, category, subcategory, releasedAt} = requestBody
        if (!isValid(title)) {
            res.status(400).send({ status: false, message: "title is required" });
            return;
        }
        if (!isValid(excerpt)) {
            res.status(400).send({ status: false, message: "excerpt required" });
            return;
        }
        if (!isValid(userId)) {
            res.status(400).send({ status: false, message: "userId is required" });
            return;
        }
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid userId` });
            return;
        }
        if (!isValid(category)) {
            res.status(400).send({ status: false, message: "category required" });
            return;
        }
        if (!isValid(subcategory)) {
            res.status(400).send({ status: false, message: "subcategory required" });
            return;
        }
        if (!isValid(releasedAt)) {
            res.status(400).send({ status: false, message: "releasedAt required" });
            return;
        }
        const istitleAlreadyUsed = await bookModel.findOne({ title });
        if (istitleAlreadyUsed) {
            res.status(400).send({ status: false, message: `${title} title already in use` });
            return;
        }
        const isISBNAlreadyUsed = await bookModel.findOne({ ISBN });
        if (isISBNAlreadyUsed) {
            res.status(400).send({ status: false, message: `${ISBN} ISBN is already exist` });
            return;
        }
        const user = await userModel.findOne({_id:userId});
        if (!user) {
            res.status(400).send({ status: false, message: "user_Id not found" });
            return;
        }
        const bookData = {title,excerpt,userId,ISBN,category,subcategory,releasedAt};
        const data = await bookModel.create(bookData);
        res.status(201).send({status: true,message: "book created succesfully",data: data});
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


// Returns all books in the collection that aren't deleted. 
// Return only book _id, title, excerpt, userId, category, releasedAt, reviews field.
// Filter books list by applying filters. Query param can have any combination of below filters:=
// By userId, By category, By subcategory 
// Return all books sorted by book name in Alphabatical order

//GET /books
const getBooks = async function(req,res){
    try{
        const filterBooks = {isDeleted:false}
        const requestQuery = req.query
        const {userId, category, subcategory} = requestQuery
        if (isValid(userId) && isValidObjectId(userId)) {
            filterBooks.userId = userId;
        }
        if (isValid(category)) {
            filterBooks.category = category.trim();
        }
        if (isValid(subcategory)) {
            filterBooks.subcategory = subcategory.trim();
        }
        const books = await bookModel.find({filterBooks})
        if (books.length === 0) {
            res.status(404).send({ status: false, message: "No Books Found" });
            return;
        }
        const sortedByBookName = books.sort((a, b) => (a.title > b.title && 1) || -1);
        res.status(200).send({status: true,message: "data found", data: sortedByBookName});
        return;
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

//Returns a book with complete details including reviews. Reviews array would be in the form of Array.

//GET /books/:bookId
const getBookById = async function(req,res){
    try{
        const bookId = req.params.bookId
        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid bookId` });
            return;
        }
        const bookDetails = await bookModel.findOne({_id:bookId, isDeleted:false})
        if(!bookDetails){
            return res.status(404).send({status:false, message:'book not found'})
        }
        const reviewData = await reviewModel.find({bookId:bookDetails._id})
        const data = bookDetails.toObject()
        data['reviewsData'] = reviewData
        return res.status(200).send({status:true, message:'Book found', data: data })
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

//Update a book by changing its title, excerpt, release date, ISBN
//Make sure the unique constraints are not violated when making the update
//Check if the bookId exists (must have isDeleted false and is present in collection).

//PUT /books/:bookId
const updateBook = async function(req,res){
    try{
        const requestBody = req.body
        const bookId = req.params.bookId
        if (!isValidrequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "request body not found" });
        }
        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid bookId` });
            return;
        }
        const book = await bookModel.findOne({_id:bookId, isDeleted:false})
        if(!book){
            return res.status(404).send({status:false, message:'book not found'})
        }
        if(!(req.user == book.userId)){
            return res.status(404).send({status:false, message:"Access denied" });
        }
        const {title, excerpt, releasedAt, ISBN} = requestBody
        const isTitleAlreadyUsed = await bookModel.findOne({title})
        if (isTitleAlreadyUsed) {
            res.status(400).send({status: false,message: `${title} is already registered`});
            return;
        }
        const isISBNAlreadyUsed = await bookModel.findOne({ISBN});
        if (isISBNAlreadyUsed) {
            res.status(400).send({status: false,message: `${ISBN} is already registered`});
            return;
        }
        const update = await bookModel.findOneAndUpdate({_id:book._id},{title, excerpt, ISBN, releasedAt},{new:true})
        if(!update){
            return res.status(400).send({status:false, message:'data not found'})
        }
        return res.status(200).send({status:true, message:'blog updated successfully', data:update})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}


//Check if the bookId exists and is not deleted. 
//If it does, mark it deleted and return an HTTP status 200

//DELETE /books/:bookId
const deleteBook = async function(req, res){
    try{
        const bookId = req.params.bookId
        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid bookId` });
            return;
        }
        const book = await bookModel.findOne({_id:bookId, isDeleted:false})
        if(!book){
            return res.status(404).send({status:false, message:'book not found'})
        }
        if (!(req.user === book.userId)) {
            res.status(401).send({ status: false, msg: `Unauthorised access` });
            return;
        }
        const delBook = await bookModel.findOneAndUpdate({_id:book._id},{isDeleted:true})
        if(!delBook){
            return res.status(404).send({status:false, message:'book not found'})
        }
        return res.status(200).send({status:true, message:'book deleted successfully', data:delBook})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

module.exports = {createBook, getBooks, getBookById, updateBook, deleteBook}
