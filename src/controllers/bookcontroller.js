const BookModel = require("../models/BookModel.js");
const UserModel = require("../models/UserModel.js");
const ReviewModel = require("../models/ReviewModel.js");
const mongoose = require("mongoose");

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

const createbooks = async function (req, res) {
    try {
        let decodedUserToken = req.user;
        const requestBody = req.body;

        if (!(decodedUserToken.userId === requestBody.userId)) {
            return res
                .status(400)
                .send({ status: false, message: "token id or user id not matched" });
        }
        if (!isValidrequestBody(requestBody)) {
            res
                .status(400)
                .send({ status: false, message: "request body is not found" });
        }

        //extract params
        const {
            title,
            excerpt,
            userId,
            ISBN,
            category,
            subcategory,
            review,
            releasedAt,
        } = requestBody;

        if (!isValid(title)) {
            res.status(400).send({ status: false, message: "title is required" });
            return;
        }

        if (!isValid(excerpt)) {
            res.status(400).send({ status: false, message: "excerpt required" });
            return;
        }

        if (!isValid(userId)) {
            res.status(400).send({ status: false, message: "userId requred" });
            return;
        }

        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: "object id is required" });
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

        const istitleAlreadyUsed = await BookModel.findOne({ title });

        if (istitleAlreadyUsed) {
            res
                .status(400)
                .send({ status: false, message: `${title} title is already exist` });
            return;
        }

        const isISBNAlreadyUsed = await BookModel.findOne({ ISBN });

        if (isISBNAlreadyUsed) {
            res
                .status(400)
                .send({ status: false, message: `${ISBN} ISBN is already exist` });
            return;
        }

        if (!isValid(userId)) {
            res.status(400).send({ status: false, message: "userId is required" });
            return;
        }

        if (!isValidObjectId(userId)) {
            res
                .status(400)
                .send({ status: false, message: `${userId} is not a valid userId` });
            return;
        }
        let user = await UserModel.findById(userId);

        if (!user) {
            res.status(400).send({ status: false, message: "user_Id not found" });
            return;
        }

        //validation end

        const bookData = {
            title,
            excerpt,
            userId,
            ISBN,
            category,
            subcategory,
            releasedAt: releasedAt ? releasedAt : "releasedAt field is mandatory",
        };
        let savedbook = await BookModel.create(bookData);
        res
            .status(201)
            .send({
                status: true,
                message: "book created succesfully",
                data: savedbook,
            });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};

module.exports.createbooks = createbooks;


//GET /books by query -------------->
const getbooks = async function (req, res) {
    try {
        let filterDel = { isDeleted: false, deletedAt: null };
        let queryPara = req.query;

        if (isValidrequestBody(queryPara)) {
            const { userId, excerpt, category, subcategory, releasedAt } = queryPara;

            if (isValid(userId) && isValidObjectId(userId)) {
                filterDel.userId = userId;
            }
            
            if (isValid(category)) {
                filterDel.category = category.trim();
            }
            
            if (isValid(subcategory)) {
                filterDel.subcategory = subcategory.trim();
            }
            
            let findBooks = await BookModel.find(filterDel).select({
                _id: 1,
                title: 1,
                excerpt: 1,
                userId: 1,
                category: 1,
                releasedAt: 1,
                reviews: 1,
            });
            

            if (Array.isArray(findBooks) && findBooks.length === 0) {
                res.status(404).send({ status: false, message: "No Books Found" });
                return;
            }

            let sortedByBookName = findBooks.sort(
                (a, b) => (a.title > b.title && 1) || -1
            );

            console.log(sortedByBookName)
            res
                .status(200)
                .send({
                    status: true,
                    message: "is this the book your looking for?",
                    data: sortedByBookName,
                });
            return;
        }

        let findNotDel = await BookModel.find({
            isDeleted: false,
            deletedAt: null,
        });

        let sortedByBookTitle = findNotDel.sort(
            (a, b) => (a.title > b.title && 1) || -1
        );
        if (sortedByBookTitle) {
            res.status(200).send({ status: true, data: sortedByBookTitle });
            return;
        }
    } catch (err) {
        return res.status(500).send({ msg: err.message });
    }
};

module.exports.getbooks = getbooks;

//GET books by Id /books/:bookId ------------------------>
const getBookWithReview = async function (req, res) {
    try {
        const bookId = req.params.bookId;

        if(!isValidObjectId(bookId)){
            res.status(400).send({status: false, message: "invalid book ID"})
            return;
        }

        if (!isValid(bookId)) {
            res
                .status(400)
                .send({
                    status: false,
                    msg: `Invalid request. No request passed in the query`,
                });
            return;
        }

        let bookDetail = await BookModel.findOne({ _id: bookId }).select({
            ISBN: 0,
        });
        //console.log( bookDetail )
        if (!isValid(bookDetail)) {
            res.status(404).send({ status: false, msg: `invalid book ID` });
            return;
        }

        let reviewsData = await ReviewModel.find({ bookId: bookDetail }).select({
            _id: 1,
            bookId: 1,
            reviewedBy: 1,
            reviewedAt: 1,
            rating: 1,
            reviews: 1,
        });
        //  console.log(reviewsData)
        let data = {
            _id: bookDetail._id,
            title: bookDetail.title,
            excerpt: bookDetail.excerpt,
            userId: bookDetail.userId,
            ISBN: bookDetail.ISBN,
            category: bookDetail.category,
            subcategory: bookDetail.subcategory,
            reviews: bookDetail.reviews,
            deletedAt: bookDetail.deletedAt,
            releasedAt: bookDetail.releasedAt,
            createdAt: bookDetail.createdAt,
            updatedAt: bookDetail.updatedAt,
            reviewsData: reviewsData,
        };
        if (reviewsData.length == 0) {
            res.status(200).send({ status: true, message: "Book List", data: data });
        }

        res.status(200).send({ status: true, message: `bookList`, data: data });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};

module.exports.getBookWithReview = getBookWithReview;

//Put update books by Id /books/:bookId---------------->
const update = async function (req, res) {
    try {
        //const requestbody= req.body
        let decodedUserToken = req.user;
       // console.log(req.params);
        let bookUser = await BookModel.findOne({ _id: req.params.bookId });
      //  console.log(bookUser);
        if (decodedUserToken.userId == bookUser.userId) {
            if (bookUser.isDeleted == true) {
                return res
                    .status(404)
                    .send({ status: false, msg: "the book has been already deleted" });
            }

            if (bookUser.isDeleted == false && bookUser.deletedAt == null) {
                const istitleAlreadyUsed = await BookModel.findOne({
                    title: req.body.title,
                });

                if (istitleAlreadyUsed) {
                    res
                        .status(400)
                        .send({
                            status: false,
                            message: `${req.body.title} these title is already registered`,
                        });
                    return;
                }

                const isISBNAlreadyUsed = await BookModel.findOne({
                    ISBN: req.body.ISBN,
                });

                if (isISBNAlreadyUsed) {
                    res
                        .status(400)
                        .send({
                            status: false,
                            message: `${req.body.ISBN} these ISBN is already registered`,
                        });
                    return;
                }

                let newdata = await BookModel.findOneAndUpdate(
                    { _id: bookUser },
                    {
                        title: req.body.title,
                        excerpt: req.body.excerpt,
                        ISBN: req.body.ISBN,
                        releasedAt: req.body.releasedAt,
                    },
                    { new: true }
                );

                if (Object.keys(req.body).length == 0) {
                    return res
                        .status(400)
                        .send({
                            status: true,
                            message: "which field do you want to update?",
                        });
                }

             //   console.log(newdata);

                res.status(200).send({ status: true, data: newdata });
            }
        } else {
            res.status(404).send({ err: "The User is Not Authorised" });
        }
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};

module.exports.update = update;

//DELETE book by ID /books/:bookId
const deletebookbyID = async function (req, res) {
    try {
        let decodedUserToken = req.user;
        // console.log(decodedUserToken)

        const bookId = req.params.bookId;
        // console.log(bookId)

        if (!isValidObjectId(bookId)) {
            res
                .status(400)
                .send({ status: false, message: `${bookId} is not a valid bookId` });
            return;
        }
        // if(!isValidObjectId(decodedUserToken)) {
        //     res.status(400).send({status: false, message: `${decodedUserToken} is not a valid token id`})
        //     return
        // }
        const deleteBook = await BookModel.findOne({
            _id: bookId,
            isDeleted: false,
        });

        console.log(deleteBook);

        if (!deleteBook) {
            res
                .status(404)
                .send({ status: false, message: `The book has been already deleted` });
            return;
        }

        if (deleteBook.userId === decodedUserToken) {
            res
                .status(401)
                .send({ status: false, msg: `id  not allow to delete book` });
            return;
        }

        await BookModel.findOneAndUpdate(
            { _id: bookId },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );
        res
            .status(200)
            .send({ status: true, message: `bookId deleted successfully` });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};

module.exports.deletebookbyID = deletebookbyID;