const {OpenAI} =require('openai');
const LmsLanguages = require("../../models/languages");
const LmsGame = require("../../models/game");
const lmsGameChoosenLang = require("../../models/gamechoosenlang");
const lmsGameContentLang = require("../../models/gamecontentlang");
const LmsBlocks = require("../../models/blocks");


const { Sequelize, DataTypes, Op } = require('sequelize');
const { error } = require("console");

  const getLanguages = async (req, res) => {
    try {
 const data = await LmsLanguages.findAll({attributes: [['language_Id','value'],['language_name','label']]});
        if(!data)
        {
            res.status(404).json({status:'Failure',message:'Bad request',err: err});  
        }
        else{
            res.status(200).json({status:'Success',message:'Data getted SuccessFully...!',data:data});
        }
    
       }   catch(err)
    {
        res.status(500).json({status:'Failure',message:'oops! something went wrong',err: err});
    }

    };
    
 const updatelanguages = async (req, res) => {
    try {
      //const id = req.params.id;
      const data = req.body;
let lngdata;
let data3;  
const condition2 = {
      where: {
        gameId: data.gameId
      }
    };
data3=await lmsGameChoosenLang.findAll(condition2);

      const record = await LmsGame.findByPk(data.gameId);
      if (!record) {
        return res.status(404).json({ status:'Failure',message: "Record not found" });
      }
const condition3 = {
      where: {
        language_Id: data.translationId
      }
    };

lngdata = await LmsLanguages.findOne(condition3);

      const updatedRecord = await record.update({ gameLanguageId: data.translationId});
      //const updatedRecord = await record.update(data);
   if (updatedRecord) {
      // Insert values into the "gamechoosenlang" table
      const { gameId, translationId} = data; // Assuming these fields are available in req.body
const condition4= {
      where: {
         gameId:gameId,
        translationId:translationId
      }
    };


 const checkexist=await lmsGameChoosenLang.findOne(condition4);
console.log(checkexist);
//if(!checkexist)
{

const createdGameChoosenLang = await lmsGameChoosenLang.create({
        gameId:gameId,
        translationId:translationId
      },{ fields: ['gameId', 'translationId']});

if(createdGameChoosenLang ){
const condition = {
      where: {
        blockGameId: gameId
      }
    };
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//let tblname=data.tblname;
////////////////////////////////////////////////////////////BLOCKS/////////////////////////////////////////////////////////////////////////
let content;

    const rows = await LmsBlocks.findAll(condition);
     if (!rows || rows.length === 0) {
      return res.status(404).json({ status: 'Failure', message: "Records not found" });
    }

console.log("______________________________________________________");
data3 = await lmsGameChoosenLang.findAll(condition2);
console.log(rows.length);
     for (const row of rows) {
console.log(row);
        const updatedContent = await translateToAnotherLanguage(lngdata.language_name,row.blockText);
console.log("Updated Content:", updatedContent);
if(updatedContent!=="Error")
{

  await lmsGameContentLang.create({
        gameId: data.gameId,
        translationId: data.translationId,
        tblName: 'lmsblocks',
        textId: row.blockId,
        content: updatedContent
      });
}
else{
res.status(500).json({ status:'Failure', message: "Transalation Error"});

}
    }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}
}
return res
        .status(200)
        .json({ status: "Success", message: "Data Updated Successfully", gamedata: updatedRecord, lngchoosen:data.translationId,data:data3,data2:lngdata});
}
 return res
        .status(200)
        .json({ status: "AlreadyExist", message: "Already exists",lngchoosen:data.translationId,data:data3});     
    } catch (error) {
      res.status(500).json({ status:'Failure', message: "Internal Server Error"+error, err: error });
    }
  };
  
///////////////////////////////////////Translate/////////////////////////////////////////////////////

async function translateToAnotherLanguage(lng,content)
{
//const OPENAI_API_KEY = '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'; // Replace with your actual OpenAI API key
const OPENAI_API_KEY = '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';
  try {
    const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
console.log("//////////////////////////////////////Translate/////////////////////////////////////////////////////");
console.log(lng);
console.log(content);
const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      "role": "system",
      "content": "You will be provided with a sentence in English, and your task is to translate it into"+lng
    },
    {
      "role": "user",
      "content": content
    }
  ],
  temperature: 0.7,
  max_tokens: 64,
  top_p: 1,
});

    const data = await response.choices[0].message.content;
console.log(data);
//    res.json(data);
console.log("//////////////////////////////////////end Translate/////////////////////////////////////////////////////");
return data;

  } catch (error) {
    console.error('Translation Error:', error);
return "Error";
//    res.status(500).json({ error: 'Translation Error' });
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////
  const getCreatedLanguages = async (req, res) => {
    try {
const getdata = req.body;
//console.log(req);
const condition = {
      where: {
        gameId: getdata.gameId
      }
    };
const condition2 = {
      where: {
        language_name: 'English'
      }
    };
//console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
const datalng = await LmsLanguages.findOne(condition2);
//console.log(datalng);
//console.log(datalng.language_Id)
//console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
if(datalng.language_Id)
{
 const data = await lmsGameChoosenLang.findAll(condition);
console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
console.log(data);
console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");

        if(!data || data.length === 0)
        {
             res.status(200).json({status:'Success',message:'Data getted SuccessFully...!',data:data,lngchoosen:datalng.language_Id,lngchoosenname:'English'});
 
        }
        else{
//console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
const data2 = await LmsGame.findOne(condition);
//console.log(data2);

if(!data2)
   res.status(200).json({status:'Success',message:'Data getted SuccessFully...!',data:data,lngchoosen:datalng.language_Id,lngchoosenname:'English'});

else
{

            res.status(200).json({status:'Success',message:'Data getted SuccessFully...!',data:data,lngchoosen:data2.gameLanguageId,lngchoosenname:'Others'});
}
        }
 }   
       }   catch(error)
    {


        res.status(500).json({status:'Failure',message:'oops! something went wrong'+error,err: error});
    }

    };


  
  module.exports = { getLanguages,updatelanguages,getCreatedLanguages};
  