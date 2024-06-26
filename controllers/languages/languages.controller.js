const { OpenAI } = require("openai");
const LmsLanguages = require("../../models/languages");
const LmsGame = require("../../models/game");
const lmsGameChoosenLang = require("../../models/gamechoosenlang");
const lmsGameContentLang = require("../../models/gamecontentlang");
const LmsBlocks = require("../../models/blocks");
const lmsCompletionScreen = require("../../models/completionScreen");
const lmsQuestionsOption = require("../../models/questionOptions");
const lmsreflectionquestion = require("../../models/reflectionQuestions");
// const { Op } = require('sequelize');

const { Sequelize, DataTypes, Op } = require("sequelize");
const { error } = require("console");

const getLanguages = async (req, res) => {
  try {
    const data = await LmsLanguages.findAll({
      attributes: [
        ["language_Id", "value"],
        ["language_name", "label"],
      ],
    });
    if (!data) {
      res
        .status(404)
        .json({ status: "Failure", message: "Bad request", err: err });
    } else {
      res.status(200).json({
        status: "Success",
        message: "Data getted SuccessFully...!",
        data: data,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "Failure",
      message: "oops! something went wrong",
      err: err,
    });
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
        gameId: data.gameId,
      },
    };
    data3 = await lmsGameChoosenLang.findAll(condition2);

    const record = await LmsGame.findByPk(data.gameId);
    if (!record) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Record not found" });
    }
    const condition3 = {
      where: {
        language_Id: data.translationId,
      },
    };

    lngdata = await LmsLanguages.findOne(condition3);

    const updatedRecord = await record.update({
      gameLanguageId: data.translationId,
    });
    //const updatedRecord = await record.update(data);
    if (updatedRecord) {
      // Insert values into the "gamechoosenlang" table
      const {
        gameId,
        translationId,
        gameNonPlayerVoice,
        gamePlayerMaleVoice,
        gamePlayerFemaleVoice,
        gameNarratorVoice,
      } = data; // Assuming these fields are available in req.body
      const condition4 = {
        where: {
          gameId: gameId,
          translationId: translationId,
          // gameNonPlayerVoice:gameNonPlayerVoice,
          // gamePlayerMaleVoice:gamePlayerMaleVoice,
          // gamePlayerFemaleVoice:gamePlayerFemaleVoice,
          // gameNarratorVoice:gameNarratorVoice,
        },
      };

      const checkexist = await lmsGameChoosenLang.findOne(condition4);
      // console.log(checkexist);
      if (!checkexist) {
        const createdGameChoosenLang = await lmsGameChoosenLang.create(
          {
            gameId: gameId,
            translationId: translationId,
            gameNonPlayerVoice: gameNonPlayerVoice,
            gamePlayerMaleVoice: gamePlayerMaleVoice,
            gamePlayerFemaleVoice: gamePlayerFemaleVoice,
            gameNarratorVoice: gameNarratorVoice,
          },
          {
            fields: [
              "gameId",
              "translationId",
              "gameNonPlayerVoice",
              "gamePlayerMaleVoice",
              "gamePlayerFemaleVoice",
              "gameNarratorVoice",
            ],
          }
        );

        if (createdGameChoosenLang) {
          const condition = {
            where: {
              blockGameId: gameId,
            },
          };
          // *
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //let tblname=data.tblname;
          ////////////////////////////////////////////////////////////BLOCKS/////////////////////////////////////////////////////////////////////////
          // *
          let content;
          console.log("______________________________________________________");
          data3 = await lmsGameChoosenLang.findAll(condition2);

          const rows = await LmsBlocks.findAll(condition);
          if (!rows || rows.length === 0) {
            // return res
            //   .status(404)
            //   .json({ status: "Failure", message: "Records not found" });
            console.log("Records not found in LmsBlocks");
          } else {
            console.log(rows.length);
            for (const row of rows) {
              console.log(row);
              const updatedContent = await translateToAnotherLanguage(
                lngdata.language_name,
                row.blockText
              );
              console.log("Updated Content:", updatedContent);
              if (updatedContent !== "Error") {
                // if(true)
                await lmsGameContentLang.create({
                  gameId: data.gameId,
                  translationId: data.translationId,
                  tblName: "lmsblocks",
                  textId: row.blockId,
                  content: updatedContent,
                  feildName: "blockText",
                });
              } else {
                res
                  .status(500)
                  .json({ status: "Failure", message: "Transalation Error" });
              }
            }
          }
          // *
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //vignesh COMPLETIONSCREEN 09-01-2024

          const condition3 = {
            where: {
              csGameId: gameId,
            },
          };

          const rows2 = await lmsCompletionScreen.findAll(condition3);

          if (!rows2 || rows2.length === 0) {
            // return res
            //   .status(404)
            //   .json({ status: "Failure", message: "Records not found" });
            console.log("Records not found in lmsCompletionScreen");
          } else {
            for (const row of rows2) {
              await createLmsGameContentLang(
                req,
                res,
                row?.dataValues?.csWishMessage,
                data?.gameId,
                data?.translationId,
                "lmscompletionscreen",
                row?.dataValues?.csId,
                "csWishMessage",
                lngdata
              );
            }
          }
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //vignesh LMSQUESTIONOPTIONS 10-01-2024
          const condition4 = {
            where: {
              qpGameId: gameId,
            },
          };

          const rows3 = await lmsQuestionsOption.findAll(condition4);

          if (!rows3 || rows3.length === 0) {
            // return res
            //   .status(404)
            //   .json({ status: "Failure", message: "Records not found" });
            console.log("Records not found in lmsQuestionsOption");
          } else {
            for (const row of rows3) {
              if (row?.dataValues) {
                if (row?.dataValues?.hasOwnProperty("qpOptionText")) {
                  await createLmsGameContentLang(
                    req,
                    res,
                    row.dataValues?.qpOptionText,
                    data?.gameId,
                    data?.translationId,
                    "lmsquestionsoption",
                    row?.qpOptionId,
                    "qpOptionText",
                    lngdata
                  );
                }

                if (row?.dataValues?.hasOwnProperty("qpOptions")) {
                  await createLmsGameContentLang(
                    req,
                    res,
                    row.dataValues?.qpOptions,
                    data?.gameId,
                    data?.translationId,
                    "lmsquestionsoption",
                    row?.qpOptionId,
                    "qpOptions",
                    lngdata
                  );
                }

                if (row?.dataValues?.hasOwnProperty("qpResponse")) {
                  await createLmsGameContentLang(
                    req,
                    res,
                    row.dataValues?.qpResponse,
                    data?.gameId,
                    data?.translationId,
                    "lmsquestionsoption",
                    row?.qpOptionId,
                    "qpResponse",
                    lngdata
                  );
                }
              }
            }
          }
          ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //vignesh LMSGame 10-01-2024
          const condition5 = {
            where: {
              gameId: gameId,
            },
          };

          const gameKeys = [
            "gameNonPlayerName",
            "gameCharacterName",
            "gameTitle",
            "gameStoryLine",
            "gameLearningOutcome",
            "gameAuthorName",
            "gameTakeawayContent",
            "gameAdditionalWelcomeNote",
            "gameThankYouMessage",
            "gameBadgeName",
            "gameScreenTitle",
            "gameCompletedCongratsMessage",
            "gameMinimumScoreCongratsMessage",
            "gameLessthanDistinctionScoreCongratsMessage",
            "gameAboveDistinctionScoreCongratsMessage",
            "gameSummarizes",
            "gamWelcomePageText",
            "gameThankYouPage",
            "gameQuestionValue1",
            "gameQuestionValue2",
            "gameQuestionValue3",
            "gameQuestionValue4",
          ];

          const rows4 = await LmsGame.findAll(condition5);
          if (!rows4 || rows4.length === 0) {
            // return res
            //   .status(404)
            //   .json({ status: "Failure", message: "Records not found" });
            console.log("Records not found in LmsGame");
          } else {
            for (const row of rows4) {
              //  const id = row?.dataValues?.gameId;
              //  console.log("id:",id);
              for (const key of gameKeys) {
                if (row?.dataValues.hasOwnProperty(key)) {
                  const content = row?.dataValues[key];

                  if (
                    content === null ||
                    content === undefined ||
                    content === ""
                  ) {
                    console.log(`${key} is null or empty. Skipping.`);
                    continue;
                  }
                  await createLmsGameContentLang(
                    req,
                    res,
                    content,
                    data?.gameId,
                    data?.translationId,
                    "lmsgame",
                    data?.gameId,
                    key,
                    lngdata
                  );
                } else {
                  console.log(`${key} does not exist in the dataValues object`);
                }
              }
            }
          }
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          //vignesh lmsreflectionquestion 10-01-2024
          const condition6 = {
            where: {
              refGameId: gameId,
            },
          };
          const rows5 = await lmsreflectionquestion.findAll(condition6);
          if (!rows5 || rows5.length === 0) {
            // return res
            //   .status(404)
            //   .json({ status: "Failure", message: "Records not found" });
            console.log("Records not found in lmsreflectionquestion");
          } else {
            for (const row of rows5) {
              await createLmsGameContentLang(
                req,
                res,
                row?.dataValues?.refQuestion,
                data?.gameId,
                data?.translationId,
                "lmsreflectionquestion",
                row?.dataValues.refId,
                "refQuestion",
                lngdata
              );
            }
          }
          ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        }
      } else {
        const updatedGameChoosenLang = await lmsGameChoosenLang.update(
          {
            gameNonPlayerVoice: gameNonPlayerVoice,
            gamePlayerMaleVoice: gamePlayerMaleVoice,
            gamePlayerFemaleVoice: gamePlayerFemaleVoice,
            gameNarratorVoice: gameNarratorVoice,
          },
          {
            where: {
              gameId: gameId,
              translationId: translationId,
            },
            fields: [
              "gameNonPlayerVoice",
              "gamePlayerMaleVoice",
              "gamePlayerFemaleVoice",
              "gameNarratorVoice",
            ],
          }
        );
        data3 = await lmsGameChoosenLang.findAll(condition2);
      }
      return res.status(200).json({
        status: "Success",
        message: "Data Updated Successfully",
        gamedata: updatedRecord,
        lngchoosen: data.translationId,
        data: data3,
        data2: lngdata,
      });
    }
    // return res.status(200).json({
    //   status: "AlreadyExist",
    //   message: "Already exists",
    //   lngchoosen: data.translationId,
    //   data: data3,
    // });
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Internal Server Error" + error,
      err: error,
    });
  }
};

// indu
const getSelectedLanguages = async (req, res) => {
  try {
    const id = req.params.id;

    const selectedLanguages = await lmsGameChoosenLang.findAll({
      attributes: ["translationId"],
      where: { gameId: id },
      include: [
        {
          model: LmsLanguages,
          attributes: ["language_name"],
          where: {
            language_Id: Sequelize.col("lmsGameChoosenLang.translationId"),
          },
          required: true,
        },
      ],
      raw: true, // Ensure the result is in raw format for simpler object structure
    });

    const gameData = { selectedLanguages };

    res.status(200).json({
      status: "Success",
      message: "Data Retrieved Successfully",
      data: gameData,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        "An error occurred while processing the request. Check the server logs for more details.",
      err: error,
    });
  }
};
const getBlockData = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;
    // console.log("translationId",translationId)
    // Fetch LmsBlocks data
    const blocksData = await LmsBlocks.findAll({
      attributes: ["blockId", "blockText", "blockPrimarySequence","blockChoosen"],
      where: { blockGameId: gameId },
      raw: true,
    });

    // Fetch lmsGameContentLang data
    const langData = await lmsGameContentLang.findAll({
      attributes: ["textId", "content"],
      where: {
        feildName: "blockText",
        translationId: translationId,
      },
      raw: true,
    });

    // Manually associate the data based on the common field (textId)
    const combinedData = blocksData.map(block => ({
      ...block,
      content: langData.find(lang => lang.textId === block.blockId)?.content,
    }));

    // Filter out objects where 'content' is empty
    const filteredData = combinedData.filter(item => item.content !== undefined);

    const responseData = { blockData: filteredData };

    res.status(200).json({
      status: "Success",
      message: "Data Retrieved Successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while processing the request. Check the server logs for more details.",
      err: error,
    });
  }
};
const getGameStoryLine = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch gameTitle
    const gameTitleData = await lmsGameContentLang.findOne({
      attributes: ['content'],
      where: {
        translationId: translationId,
        feildName: 'gameTitle',
        textId: gameId,
      },
      raw: true,
    });

    // Fetch gameStoryLine
    const gameStoryLineData = await lmsGameContentLang.findOne({
      attributes: ['content'],
      where: {
        translationId: translationId,
        feildName: 'gameStoryLine',
        textId: gameId,
      },
      raw: true,
    });

    // Fetch gameNonPlayerName
    const gameNonPlayerNameData = await lmsGameContentLang.findOne({
      attributes: ['content'],
      where: {
        translationId: translationId,
        feildName: 'gameNonPlayerName',
        textId: gameId,
      },
      raw: true,
    });
    const gameCompletedCongratsMessageData = await lmsGameContentLang.findOne({
      attributes: ['content'],
      where: {
        translationId: translationId,
        feildName: 'gameCompletedCongratsMessage',
        textId: gameId,
      },
      raw: true,
    });

    // Fetch gameScreenTitle
    const gameScreenTitleData = await lmsGameContentLang.findOne({
      attributes: ['content'],
      where: {
        translationId: translationId,
        feildName: 'gameScreenTitle',
        textId: gameId,
      },
      raw: true,
    });
    // Fetch LmsGame data
    const lmsGameData = await LmsGame.findOne({
      attributes: ['gameStoryLine'],
      where: {
        gameId: gameId,
      },
      raw: true,
    });

    if (!lmsGameData) {
      return res.status(404).json({
        error: `No LmsGame data found for gameId: ${gameId}`,
      });
    }

    return res.status(200).json({
      gameTitle: gameTitleData ? gameTitleData.content : null,
      gameStoryLine: gameStoryLineData.content,
      gameNonPlayerName: gameNonPlayerNameData ? gameNonPlayerNameData.content : null,
      gameCompletedCongratsMessage: gameCompletedCongratsMessageData ? gameCompletedCongratsMessageData.content : null,
      gameScreenTitle: gameScreenTitleData ? gameScreenTitleData.content : null,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'An error occurred while processing the request. Check the server logs for more details.',
    });
  }
};
const getQuestionOptionsText = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch question options with qpDeleteStatus 'No'
    const optionTextData = await lmsQuestionsOption.findAll({
      attributes: ['qpOptionId','qpSecondaryId', 'qpOptionText', 'qpSequence', 'qpQuestNo', 'qpOptions'],
      where: {
        qpGameId: gameId,
        qpDeleteStatus: 'No',
      },
      raw: true,
    });

    // Fetch content for optionText with qpDeleteStatus 'No'
    const contentOptionTextData = await lmsGameContentLang.findAll({
      attributes: ['textId', 'content'],
      where: {
        translationId: translationId,
        feildName: 'qpOptionText',
        textId: optionTextData.map(option => option.qpOptionId),
      },
      raw: true,
    });

    // Combine optionTextData with contentOptionTextData
    const optionTextsWithContent = optionTextData.map(option => ({
      ...option,
      contentOptionTextData: contentOptionTextData.filter(content => content.textId === option.qpOptionId),
    }));

    return res.status(200).json({ optionText: optionTextsWithContent });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'An error occurred while processing the request. Check the server logs for more details.',
    });
  }
};

const getQuestionOptions = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch question options with qpDeleteStatus 'No'
    const optionTextData = await lmsQuestionsOption.findAll({
      attributes: ['qpOptionId',  'qpSequence', 'qpQuestNo', 'qpOptions'],
      where: {
        qpGameId: gameId,
        qpDeleteStatus: 'No',
      },
      raw: true,
    });

    // Fetch content for optionText with qpDeleteStatus 'No'
    const contentOptionTextData = await lmsGameContentLang.findAll({
      attributes: ['textId', 'content'],
      where: {
        translationId: translationId,
        feildName: 'qpOptions',
        textId: optionTextData.map(option => option.qpOptionId),
      },
      raw: true,
    });

    // Combine optionTextData with contentOptionTextData
    const optionTextsWithContent = optionTextData.map(option => ({
      ...option,
      contentOptionTextData: contentOptionTextData.filter(content => content.textId === option.qpOptionId),
    }));

    return res.status(200).json({ optionText: optionTextsWithContent });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'An error occurred while processing the request. Check the server logs for more details.',
    });
  }
};

const getQuestionResponse = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch question options with qpDeleteStatus 'No'
    const optionTextData = await lmsQuestionsOption.findAll({
      attributes: ['qpOptionId',  'qpSequence','qpResponse', 'qpQuestNo', 'qpOptions'],
      where: {
        qpGameId: gameId,
        qpDeleteStatus: 'No',
      },
      raw: true,
    });

    // Fetch content for optionText with qpDeleteStatus 'No'
    const contentOptionTextData = await lmsGameContentLang.findAll({
      attributes: ['textId', 'content'],
      where: {
        translationId: translationId,
        feildName: 'qpResponse',
        textId: optionTextData.map(option => option.qpOptionId),
      },
      raw: true,
    });

    // Combine optionTextData with contentOptionTextData
    const optionTextsWithContent = optionTextData.map(option => ({
      ...option,
      contentOptionTextData: contentOptionTextData.filter(content => content.textId === option.qpOptionId),
    }));

    return res.status(200).json({ optionText: optionTextsWithContent });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'An error occurred while processing the request. Check the server logs for more details.',
    });
  }
};








// const getGameStoryLine = async (req, res) => {
//   try {
//     const gameId = req.params.id;
//     const translationId = req.params.translationId;
// console.log('gameId',gameId)
//     // Fetch LmsGame data
//     const lmsGameData = await LmsGame.findOne({
//       attributes: ['gameStoryLine'],
//       where: {
//         gameId: gameId,
//       },
//       raw: true,
//     });

//     if (!lmsGameData) {
//       return res.status(404).json({
//         error: `No LmsGame data found for gameId: ${gameId}`,
//       });
//     }

//     // Fetch LmsGameContentLang data separately
//     const lmsGameContentLangData = await lmsGameContentLang.findOne({
//       attributes: ['content'],
//       where: {
//         translationId: translationId,
//         feildName: 'gameStoryLine',
//         textId: gameId, // Change this to lmsGameData.gameId if it's the correct foreign key
//       },
//       raw: true,
//     });
    

//     if (!lmsGameContentLangData) {
//       return res.status(404).json({
//         error: `No LmsGameContentLang data found for translationId: ${translationId}`,
//       });
//     }

//     return res.status(200).json({
//       gameStoryLine: lmsGameData.gameStoryLine,
//       content: lmsGameContentLangData.content,
//     });
//   } catch (error) {
//     console.error('Error:', error.message);
//     return res.status(500).json({
//       error: 'An error occurred while processing the request. Check the server logs for more details.',
//     });
//   }
// };






// module.exports = { getBlockData };

// };

////////vignesh 10-01-24////////////////////////////////

const createLmsGameContentLang = async (
  req,
  res,
  content,
  gameId,
  translationId,
  tableName,
  id,
  feildName,
  lngdata
) => {
  const updatedContent = await translateToAnotherLanguage(
    lngdata.language_name,
    content
  );
  if (updatedContent !== "Error") {
    //  if(true)
    await lmsGameContentLang.create({
      gameId: gameId,
      translationId: translationId,
      tblName: tableName,
      textId: id,
      content: updatedContent,
      feildName: feildName,
    });
  } else {
    res.status(500).json({ status: "Failure", message: "Transalation Error" });
  }
};

////////////////////////////////////////////////////////

///////////////////////////////////////Translate/////////////////////////////////////////////////////

async function translateToAnotherLanguage(lng, content) {
    try {
    const openai = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(
      "//////////////////////////////////////Translate/////////////////////////////////////////////////////"
    );
    console.log(lng);
    console.log(content);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You will be provided with a sentence in English, and your task is to translate it into" +
            lng,
        },
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.7,
      max_tokens: 64,
      top_p: 1,
    });

    const data = await response.choices[0].message.content;
    console.log(data);
    //    res.json(data);
    console.log(
      "//////////////////////////////////////end Translate/////////////////////////////////////////////////////"
    );
    return data;
  } catch (error) {
    console.error("Translation Error:", error);
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
        gameId: getdata.gameId,
      },
    };
    const condition2 = {
      where: {
        language_name: "English",
      },
    };
    //console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
    const datalng = await LmsLanguages.findOne(condition2);
    //console.log(datalng);
    //console.log(datalng.language_Id)
    //console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
    if (datalng.language_Id) {
      const data = await lmsGameChoosenLang.findAll(condition);
      console.log(
        "((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((("
      );
      console.log(data);
      console.log(
        "((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((("
      );

      if (!data || data.length === 0) {
        res.status(200).json({
          status: "Success",
          message: "Data getted SuccessFully...!",
          data: data,
          lngchoosen: datalng.language_Id,
          lngchoosenname: "English",
        });
      } else {
        //console.log("(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((");
        const data2 = await LmsGame.findOne(condition);
        //console.log(data2);

        if (!data2)
          res.status(200).json({
            status: "Success",
            message: "Data getted SuccessFully...!",
            data: data,
            lngchoosen: datalng.language_Id,
            lngchoosenname: "English",
          });
        else {
          res.status(200).json({
            status: "Success",
            message: "Data getted SuccessFully...!",
            data: data,
            lngchoosen: data2.gameLanguageId,
            lngchoosenname: "Others",
          });
        }
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "oops! something went wrong" + error,
      err: error,
    });
  }
};

// vignesh 10-01-2024 and 12-01-2024

const updateLanguageContent = async (req, res) => {
  try {
    const condition = {
      where: {
        gameId: req.body.gameId,
        translationId: req.body.translationId,
      },
    };
    const data = await lmsGameChoosenLang.findAll(condition);

    if (data.length !== 0) {
      const record = await lmsGameContentLang.findOne({
        where: {
          gameId: req.body.gameId,
          tblName: req.body.tblName,
          textId: req.body.textId,
          feildName: req.body.feildName,
          translationId: req.body.translationId,
        },
      });
      if (!record) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Record not found" });
      }
      const condition = {
        where: {
          language_Id: req.body.translationId,
        },
      };

      // lngdata = await LmsLanguages.findOne(condition);
      const content = req?.body?.content;
      const updatedContent = await translateToAnotherLanguage(
        lngdata.language_name,
        content
      );
      if (updatedContent !== "Error") {
        const updated = await record.update({
          content: updatedContent,
        });

        res
          .status(200)
          .json({
            status: "Success",
            message: "Data Updated Successfully",
            data: updated,
          });
      } else {
        res
          .status(500)
          .json({ status: "Failure", message: "Transalation Error" });
      }
    } else {
      const createdGameChoosenLang = await lmsGameChoosenLang.create(
        {
          gameId: req?.body?.gameId,
          translationId: req?.body?.translationId,
        },
        { fields: ["gameId", "translationId"] }
      );

      if (createdGameChoosenLang) {
        const condition = {
          where: {
            language_Id: createdGameChoosenLang.translationId,
          },
        };

        lngdata = await LmsLanguages.findOne(condition);

        const updatedContent = await translateToAnotherLanguage(
          lngdata.language_name,
          req.body.content
        );
        if (updatedContent !== "Error") {
          // if(true)
          const data = await lmsGameContentLang.create({
            gameId: req.body.gameId,
            translationId: req.body.translationId,
            tblName: req.body.tblName,
            textId: req.body.textId,
            content: updatedContent,
            feildName: req.body.feildName,
          });
          if (!data) {
            return res
              .status(404)
              .json({ status: "Failure", message: "Record not Inserted" });
          }

          return res.status(200).json({
            status: "Success",
            message: "Data Inserted Successfully",
            gamedata: data,
            lngchoosen: data.translationId,
          });
        } else {
          res
            .status(500)
            .json({ status: "Failure", message: "Transalation Error" });
        }
      }

      return res
        .status(404)
        .json({ status: "Failure", message: "Record not Inserted" });
    }
  } catch (error) {
    res.status(500).json({
      status: "Failure",
      message: "Internal Server Error" + error,
      err: error,
    });
  }
};

/////////////////////

module.exports = {
  getLanguages,
  updatelanguages,
  getCreatedLanguages,
  updateLanguageContent,
  getSelectedLanguages,
  getBlockData,
  getGameStoryLine,
  getQuestionOptions,
  getQuestionOptionsText,
  getQuestionResponse
};
