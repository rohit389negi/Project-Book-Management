const express = require('express');

const router = express.Router();

const userController=require("../controllers/userController")
const bookController=require("../controllers/bookController")
const reviewController=require("../controllers/reviewController")
const middleware=require("../middleware/authorisation")

//USER API
router.post('/User',userController.createUser)
router.post('/login',userController.login)

//BOOK API 
router.post('/books',middleware.authorise, bookController.createBook) 
router.get('/books',middleware.authorise, bookController.getBooks)
router.get('/books/:bookId',middleware.authorise, bookController.getBookById )
router.put('/books/:bookId',middleware.authorise, bookController.updateBook ) 
router.delete('/books/:bookId',middleware.authorise, bookController.deleteBook) 

//Reiew API 
router.post('/books/:bookId/review',reviewController.createReview)
router.put('/books/:bookId/review/:reviewId',reviewController.updateReview)
router.delete('/books/:bookId/review/:reviewId',reviewController.deleteReview )


module.exports = router;