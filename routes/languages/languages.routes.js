const express = require('express');
const {getLanguages,updatelanguages,getCreatedLanguages,updateLanguageContent,getSelectedLanguages,getBlockData,getGameStoryLine,getQuestionOptions,getQuestionOptionsText,
    getQuestionResponse, getGameLanguages} = require('../../controllers/languages/languages.controller');
const router = express.Router();


router.get('/getlanguages',getLanguages);
router.get('/getBlockData/:id/:translationId',getBlockData);
router.get('/getGameStoryLine/:id/:translationId',getGameStoryLine);
router.get('/getQuestionOptions/:id/:translationId',getQuestionOptions);
router.get('/getQuestionOptionsText/:id/:translationId',getQuestionOptionsText);
router.get('/getQuestionResponse/:id/:translationId',getQuestionResponse);


router.get('/getSelectedLanguages/:id',getSelectedLanguages);
router.post('/getcreatedlanguages',getCreatedLanguages);
router.post('/updatelanguages',updatelanguages);
// vignesh 10-01-24
router.post('/updatecontent',updateLanguageContent);
router.get('/getGameLanguages/:id',getGameLanguages); //used for Demo game play
module.exports = router;