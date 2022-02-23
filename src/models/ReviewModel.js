const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({

    bookId: {
        type:mongoose.Schema.Types.ObjectId,
        required:'bookId is required',
        ref:'Books'
    },
    reviewedBy:{
        type:String,
        required:'view is required',
        default:'Guest',
        trim: true
    },
    reviewedAt: {
        type:Date,
        require:"When was Reviewed?",
        default:Date.now()
    },
    rating: {
        type:Number,
        required:true,
        min: 1,
        max: 5,
        trim: true
    },
    reviews:{
        type: String,
        trim: true
    },
    isDeleted:{
        type: Boolean,
        default: false
    }    
})


module.exports = mongoose.model('Review',reviewSchema)