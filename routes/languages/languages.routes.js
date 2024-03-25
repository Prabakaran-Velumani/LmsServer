const express = require('express');
const {getLanguages,updatelanguages,getCreatedLanguages,updateLanguageContent,getSelectedLanguages,getBlockData,getGameStoryLine,getQuestionOptions,getQuestionOptionsText,
    getQuestionResponse, getGameLanguages,getContentRelatedLanguage} = require('../../controllers/languages/languages.controller');
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
//Afrith-modified-starts-20/Mar/24
// router.get('/getContentRelatedLanguage/:id', getContentRelatedLanguage); //used to get selected langId from Demo game play(Character Selection)
router.get('/getContentRelatedLanguage/:currGameId/:langId', getContentRelatedLanguage); //used to get selected langId from Demo game play(Character Selection)

module.exports = router;