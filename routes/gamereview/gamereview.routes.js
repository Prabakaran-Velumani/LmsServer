const express = require('express');
const {addGameReview, addGameReviewers,getGameBlockReview, updateGameBlockReview,deleteGameBlockReview, getGameBlockReviewList, getGameAllReviews,getGameReviewById} = require('../../controllers/gamereview/gamereview.controller');
// const { uploadSettings, fileFilters, storageLocations } = require('../../config/storageConfig');
const router = express.Router();

//Reviewer's API Route
router.post('/getblockreview',getGameBlockReview);// for review id based result, only returns non deleted results 
router.post('/getAllreviews',getGameAllReviews);// get all reviews of a reviewer of that screen or type, only returns non deleted results 
router.get('/getreview/:id',getGameReviewById);// get all reviews of a reviewer of that screen or type, only returns non deleted results 
router.post('/addblockreview',addGameReview); //review submitted for each blocks of a game by a reviewer
router.post('/addreviewers',addGameReviewers);
router.put('/blockreview',updateGameBlockReview);
router.delete('/blockreview/:id',deleteGameBlockReview);//doing soft delete only


//Creator's Route
router.post('/getblockreviewlist',getGameBlockReviewList);// get All reviews for a  gameId and current Block/Screen/Field

module.exports = router;