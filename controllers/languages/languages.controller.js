const { OpenAI } = require("openai");
const LmsLanguages = require("../../models/languages");
const LmsGame = require("../../models/game");
const lmsGameChoosenLang = require("../../models/gamechoosenlang");
const lmsGameContentLang = require("../../models/gamecontentlang");
const LmsBlocks = require("../../models/blocks");
const lmsCompletionScreen = require("../../models/completionScreen");
const lmsQuestionsOption = require("../../models/questionOptions");
const lmsreflectionquestion = require("../../models/reflectionQuestions");

const { Sequelize, DataTypes, Op } = require("sequelize");
const { error } = require("console");
const ReflectionQuestion = require("../../models/reflectionQuestions");

const fsp = require("fs").promises;
const fs = require("fs");
const path = require("path");

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
          data3 = await lmsGameChoosenLang.findAll(condition2);

          const rows = await LmsBlocks.findAll(condition);
          if (!rows || rows.length === 0) {
            console.log("Records not found in LmsBlocks");
          } else {
            for (const row of rows) {
              const updatedContent = await translateToAnotherLanguage(
                lngdata.language_name,
                row.blockText
              );

              if (updatedContent !== "Error") {
                /** For Text to Audio Convertion */
                const apiReqHeaderData = {
                  text: updatedContent,
                  model_id: "eleven_multilingual_v2",
                  voice_settings: {
                    similarity_boost: 0.4,
                    stability: 0.7,
                    style: 0.1,
                    use_speaker_boost: true,
                  },
                };

                const newLangContentRow = {
                  gameId: data.gameId,
                  translationId: data.translationId,
                  tblName: "lmsblocks",
                  textId: row.blockId,
                  content: updatedContent,
                  fieldName: "blockText",
                };
                /**params{
 * updatedContent-> translated text content 
 * apiReqHeaderData-> text: updatedContent,
                  model_id: "eleven_multilingual_v2",
                  voice_settings: {
                    similarity_boost: .4,
                    stability: .7,
                    style: .1,
                    use_speaker_boost: true,
                  },
 * newLangContentRow  -> {  gameId: data.gameId,
                  translationId: data.translationId,
                  tblName: "lmsblocks",
                  textId: row.blockId,
                  content: updatedContent,
                  fieldName: "blockText",
                  }
 * lngdata      ->lmsMultipleLanuageSupport table row data
 * 
*/
                const audioUrls = await getConvertedTextToAudioUrls(
                  apiReqHeaderData,
                  newLangContentRow,
                  req.body,
                  lngdata
                );
                await lmsGameContentLang.create({
                  gameId: data.gameId,
                  translationId: data.translationId,
                  tblName: "lmsblocks",
                  textId: row.blockId,
                  content: updatedContent,
                  fieldName: "blockText",
                  audioUrls: audioUrls, //can use this data after JSON.parse()
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
      attributes: [
        "blockId",
        "blockText",
        "blockPrimarySequence",
        "blockChoosen",
      ],
      where: { blockGameId: gameId },
      raw: true,
    });

    // Fetch lmsGameContentLang data
    const langData = await lmsGameContentLang.findAll({
      attributes: ["textId", "content"],
      where: {
        fieldName: "blockText",
        translationId: translationId,
      },
      raw: true,
    });

    // Manually associate the data based on the common field (textId)
    const combinedData = blocksData.map((block) => ({
      ...block,
      content: langData.find((lang) => lang.textId === block.blockId)?.content,
    }));

    // Filter out objects where 'content' is empty
    const filteredData = combinedData.filter(
      (item) => item.content !== undefined
    );

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
      message:
        "An error occurred while processing the request. Check the server logs for more details.",
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
      attributes: ["content"],
      where: {
        translationId: translationId,
        fieldName: "gameTitle",
        textId: gameId,
      },
      raw: true,
    });

    // Fetch gameStoryLine
    const gameStoryLineData = await lmsGameContentLang.findOne({
      attributes: ["content"],
      where: {
        translationId: translationId,
        fieldName: "gameStoryLine",
        textId: gameId,
      },
      raw: true,
    });

    // Fetch gameNonPlayerName
    const gameNonPlayerNameData = await lmsGameContentLang.findOne({
      attributes: ["content"],
      where: {
        translationId: translationId,
        fieldName: "gameNonPlayerName",
        textId: gameId,
      },
      raw: true,
    });
    const gameCompletedCongratsMessageData = await lmsGameContentLang.findOne({
      attributes: ["content"],
      where: {
        translationId: translationId,
        fieldName: "gameCompletedCongratsMessage",
        textId: gameId,
      },
      raw: true,
    });

    // Fetch gameScreenTitle
    const gameScreenTitleData = await lmsGameContentLang.findOne({
      attributes: ["content"],
      where: {
        translationId: translationId,
        fieldName: "gameScreenTitle",
        textId: gameId,
      },
      raw: true,
    });
    // Fetch LmsGame data
    const lmsGameData = await LmsGame.findOne({
      attributes: ["gameStoryLine"],
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
      gameNonPlayerName: gameNonPlayerNameData
        ? gameNonPlayerNameData.content
        : null,
      gameCompletedCongratsMessage: gameCompletedCongratsMessageData
        ? gameCompletedCongratsMessageData.content
        : null,
      gameScreenTitle: gameScreenTitleData ? gameScreenTitleData.content : null,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error:
        "An error occurred while processing the request. Check the server logs for more details.",
    });
  }
};
const getQuestionOptionsText = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch question options with qpDeleteStatus 'No'
    const optionTextData = await lmsQuestionsOption.findAll({
      attributes: [
        "qpOptionId",
        "qpSecondaryId",
        "qpOptionText",
        "qpSequence",
        "qpQuestNo",
        "qpOptions",
      ],
      where: {
        qpGameId: gameId,
        qpDeleteStatus: "No",
      },
      raw: true,
    });

    // Fetch content for optionText with qpDeleteStatus 'No'
    const contentOptionTextData = await lmsGameContentLang.findAll({
      attributes: ["textId", "content"],
      where: {
        translationId: translationId,
        fieldName: "qpOptionText",
        textId: optionTextData.map((option) => option.qpOptionId),
      },
      raw: true,
    });

    // Combine optionTextData with contentOptionTextData
    const optionTextsWithContent = optionTextData.map((option) => ({
      ...option,
      contentOptionTextData: contentOptionTextData.filter(
        (content) => content.textId === option.qpOptionId
      ),
    }));

    return res.status(200).json({ optionText: optionTextsWithContent });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error:
        "An error occurred while processing the request. Check the server logs for more details.",
    });
  }
};

const getQuestionOptions = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch question options with qpDeleteStatus 'No'
    const optionTextData = await lmsQuestionsOption.findAll({
      attributes: ["qpOptionId", "qpSequence", "qpQuestNo", "qpOptions"],
      where: {
        qpGameId: gameId,
        qpDeleteStatus: "No",
      },
      raw: true,
    });

    // Fetch content for optionText with qpDeleteStatus 'No'
    const contentOptionTextData = await lmsGameContentLang.findAll({
      attributes: ["textId", "content"],
      where: {
        translationId: translationId,
        fieldName: "qpOptions",
        textId: optionTextData.map((option) => option.qpOptionId),
      },
      raw: true,
    });

    // Combine optionTextData with contentOptionTextData
    const optionTextsWithContent = optionTextData.map((option) => ({
      ...option,
      contentOptionTextData: contentOptionTextData.filter(
        (content) => content.textId === option.qpOptionId
      ),
    }));

    return res.status(200).json({ optionText: optionTextsWithContent });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error:
        "An error occurred while processing the request. Check the server logs for more details.",
    });
  }
};

const getQuestionResponse = async (req, res) => {
  try {
    const gameId = req.params.id;
    const translationId = req.params.translationId;

    // Fetch question options with qpDeleteStatus 'No'
    const optionTextData = await lmsQuestionsOption.findAll({
      attributes: [
        "qpOptionId",
        "qpSequence",
        "qpResponse",
        "qpQuestNo",
        "qpOptions",
      ],
      where: {
        qpGameId: gameId,
        qpDeleteStatus: "No",
      },
      raw: true,
    });

    // Fetch content for optionText with qpDeleteStatus 'No'
    const contentOptionTextData = await lmsGameContentLang.findAll({
      attributes: ["textId", "content"],
      where: {
        translationId: translationId,
        fieldName: "qpResponse",
        textId: optionTextData.map((option) => option.qpOptionId),
      },
      raw: true,
    });

    // Combine optionTextData with contentOptionTextData
    const optionTextsWithContent = optionTextData.map((option) => ({
      ...option,
      contentOptionTextData: contentOptionTextData.filter(
        (content) => content.textId === option.qpOptionId
      ),
    }));

    return res.status(200).json({ optionText: optionTextsWithContent });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error:
        "An error occurred while processing the request. Check the server logs for more details.",
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
//         fieldName: 'gameStoryLine',
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
  fieldName,
  lngdata
) => {
  const updatedContent = await translateToAnotherLanguage(
    lngdata.language_name,
    content
  );

  if (updatedContent !== "Error") {
    /** For Text to Audio Convertion */
    const apiReqHeaderData = {
      text: updatedContent,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        similarity_boost: 0.4,
        stability: 0.7,
        style: 0.1,
        use_speaker_boost: true,
      },
    };

    const newLangContentRow = {
      gameId: gameId,
      translationId: translationId,
      tblName: tableName,
      textId: id, //primary key id of a table
      content: updatedContent, //text
      fieldName: fieldName, // text field name
    };

    /** params{
* updatedContent-> translated text content 
* apiReqHeaderData-> text: updatedContent,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        similarity_boost: .4,
        stability: .7,
        style: .1,
        use_speaker_boost: true,
      },
* newLangContentRow  -> {  gameId: data.gameId,
      translationId: data.translationId,
      tblName: "lmsblocks",
      textId: row.blockId,
      content: updatedContent,
      fieldName: "blockText",
      }
* lngdata      ->lmsMultipleLanuageSupport table row data
* 
*/
    const audioUrls = await getConvertedTextToAudioUrls(
      apiReqHeaderData,
      newLangContentRow,
      req.body,
      lngdata
    );

    await lmsGameContentLang.create({
      gameId: gameId,
      translationId: translationId,
      tblName: tableName,
      textId: id,
      content: updatedContent,
      fieldName: fieldName,
      audioUrls: audioUrls,
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
    return data;
  } catch (error) {
    console.error("Translation Error:", error);
    return "Error";
  }
}

const getCreatedLanguages = async (req, res) => {
  try {
    const getdata = req.body;
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
    const datalng = await LmsLanguages.findOne(condition2);
    if (datalng.language_Id) {
      const data = await lmsGameChoosenLang.findAll(condition);
      if (!data || data.length === 0) {
        res.status(200).json({
          status: "Success",
          message: "Data getted SuccessFully...!",
          data: data,
          lngchoosen: datalng.language_Id,
          lngchoosenname: "English",
        });
      } else {
        const data2 = await LmsGame.findOne(condition);
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
  const transaction = await sequelize.transaction();
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
          fieldName: req.body.fieldName,
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

      lngdata = await LmsLanguages.findOne(condition);
      const content = req?.body?.content;
      const updatedContent = await translateToAnotherLanguage(
        lngdata.language_name,
        content
      );

      if (updatedContent !== "Error") {
        /** For Text to Audio Convertion */
        const apiReqHeaderData = {
          text: updatedContent,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            similarity_boost: 0.4,
            stability: 0.7,
            style: 0.1,
            use_speaker_boost: true,
          },
        };

        const newLangContentRow = {
          gameId: req.body.gameId,
          translationId: req.body.translationId,
          tblName: req.body.tblName,
          textId: req.body.textId, //primary key id of a table
          content: updatedContent, //text
          fieldName: req.body.fieldNam, // text field name
        };
        /**params{
* updatedContent-> translated text content 
* apiReqHeaderData-> text: updatedContent,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        similarity_boost: .4,
        stability: .7,
        style: .1,
        use_speaker_boost: true,
      },
* newLangContentRow  -> {  gameId: data.gameId,
      translationId: data.translationId,
      tblName: "lmsblocks",
      textId: row.blockId,
      content: updatedContent,
      fieldName: "blockText",
      }
* lngdata      ->lmsMultipleLanuageSupport table row data
* 
*/
        const audioUrls = await getConvertedTextToAudioUrls(
          apiReqHeaderData,
          newLangContentRow,
          req.body,
          lngdata
        );
        //clear the existing audio file(s), while update it from server storage
        const audioUrlsArray = JSON.parse(record.audioUrls).map(
          (item) => item.audioUrl
        );
        const deleteAudioFileStatus = await deleteAudioFiles(audioUrlsArray);

        const updated = await record.update({
          content: updatedContent,
          audioUrls: audioUrls,
        });

        res.status(200).json({
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
        { fields: ["gameId", "translationId"], transaction }
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
            fieldName: req.body.fieldName,
            // audioUrls: filePathString
          });
          await transaction.commit();
          if (!data) {
            await transaction.rollback();
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

const convertTextToAudio = async (
  data,
  voiceIds = {},
  gameId,
  langCode = "en"
) => {
  /***
 * data = {
 * text:'',
 * model_id: '',
 * voice_settings: {
      stability: 123,
      similarity_boost: 123,
      style: 123,
      use_speaker_boost: true
    }
 * }
 */
    const fileArray = []; // Define fileArray to store information about the generated audio files
    try {
      if (!voiceIds || !data || !langCode || !gameId) {
        throw new Error('Missing required arguments: voiceIds, data, langCode, gameId');
      }
      console.log('gameId', gameId);
  
      const promises = Object.entries(voiceIds).map(async ([key, voiceId]) => {
        if (!voiceId) {
          return {
            status: "Failure",
            data: [],
            error: 'Voice Id missing',
          };
        }
        
        const send = {
          text: data.text,
          model_id: data?.model_id ?? "eleven_multilingual_v2",
          voice_settings: data?.voice_settings ?? {
            similarity_boost: 0.3,
            stability: 0.6,
            style: 0,
            use_speaker_boost: true,
          },
        };
  
        const options = {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLAPS_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(send),
        };
  
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          options);
          console.log('response.ok', response.ok);
  
          if (!response.ok) {
            throw new Error(`Failed to fetch audio for voiceId ${voiceId}`);
        }

        const contentType = response.headers.get('content-type');
        console.log('contentType', contentType)
        if (!contentType || !contentType.startsWith('audio/')) {
          console.log('!contentType || !contentType.startsWith(audio/')
          
            throw new Error(`Invalid response or missing audio content for voiceId ${voiceId}`);
        }
  
        const timestamp = Date.now();
        const filename = `${langCode}_${voiceId}_${timestamp}.mp3`;
        const directory = path.join(__dirname, "../../uploads", "tta", gameId, langCode);
        const filePath =  path.join("uploads","tta", gameId, langCode, filename);
        const audioUrl =  `/uploads/tta/${gameId}/${langCode}/${filename}`;
  
        // Ensure the directory exists, create it if it doesn't
        await fs.promises.mkdir(directory, { recursive: true });
        // Convert the response to an ArrayBuffer
        const buffer = await response.arrayBuffer();

        // Write the buffer to a file
        await fs.promises.writeFile(filePath, Buffer.from(buffer));
        fileArray.push({ filename: filename, path: audioUrl, voiceId: voiceId, error: "" });
      });
  
      await Promise.all(promises);
  
      return {
        status: fileArray.length > 0 ? "Success" : "Failure",
        data: fileArray,
        error: '',
      };
    } catch (error) {
      console.error('Error:', error.message);
      return { status: "Failure", error: error.message};
    }
};

const getSpeakerVoiceId = async (lmsgamecontentlang, selectedlangOptions) => {
  /**selectedlangOptions  => req.body
   * lmsgamecontentlang => lmsgamecontentlang row data
   *
   */
  /*** Hint****
   * selectedlangOptions Object as
   * {gamecontentId: id,
   *  gameId: id,
   *  translationId: id,
   *  tblName: string,
   *  textId: id,
   *  content : string,
   *  fieldName : string
   */

  const voiceIds = {
    narrator: null,
    nonplayer: null,
    malePlayer: null,
    femalePlayer: null,
  };

  if (lmsgamecontentlang) {
    switch (lmsgamecontentlang?.tblName) {
      case "lmsgame":
        voiceIds.narrator = selectedlangOptions.gameNarratorVoice;
        return voiceIds;
      case "lmsblocks":
        const currentBlock = await LmsBlocks.findByPk(
          lmsgamecontentlang?.textId,
          {
            attributes: ["blockRoll"],
          }
        );
        return await getMappedVoice(currentBlock, selectedlangOptions);
      case "lmsquestionsoption":
        if (lmsgamecontentlang.fieldName == "qpFeedback") {
          voiceIds.malePlayer = selectedlangOptions?.gamePlayerMaleVoice;
          voiceIds.femalePlayer = selectedlangOptions?.gamePlayerFemaleVoice;
        }
        if (
          lmsgamecontentlang.fieldName == "qpOptions" ||
          lmsgamecontentlang.fieldName == "qpOptionText"
        ) {
          const currentQuestionOptionBlock = await lmsQuestionsOption.findByPk(
            lmsgamecontentlang?.textId,
            {
              attributes: ["qpQuestionId"],
              include: {
                model: LmsBlocks,
                as: "lmsQuestionBlock",
                attributes: ["blockRoll"],
              },
            }
          );
          const result = await getMappedVoice(
            currentQuestionOptionBlock.lmsQuestionBlock,
            selectedlangOptions
          );
          result.malePlayer = selectedlangOptions?.gamePlayerMaleVoice;
          result.femalePlayer = selectedlangOptions?.gamePlayerFemaleVoice;
          return result;
        }
        if (lmsgamecontentlang.fieldName == "qpResponse") {
          const currentQuestionOptionBlock = await lmsQuestionsOption.findByPk(
            lmsgamecontentlang?.textId,
            {
              attributes: ["qpQuestionId"],
              include: {
                model: LmsBlocks,
                as: "lmsQuestionBlock",
                attributes: ["blockRoll"],
              },
            }
          );
          return await getMappedVoice(
            currentQuestionOptionBlock.lmsQuestionBlock,
            selectedlangOptions
          );
        }
      case "lmsreflectionquestion":
        return [selectedlangOptions.gameNarratorVoice];
      default:
        return [selectedlangOptions.gameNarratorVoice];
    }
  }
  return true;
};

const getMappedVoice = async (row, selectedlangOptions) => {
  /**** Hint ****
   * If blockRoll == 999999 then took player voiceIds(for Male and Female)
   * else if  blockRoll == 'Narrator' then took narrator voiceId
   * blockRoll == id not 999999 then it is a non players voiceId
   */
  const voiceId = {
    narrator: null,
    nonplayer: null,
    malePlayer: null,
    femalePlayer: null,
  };

  switch (row?.blockRoll) {
    case "999999":
      voiceId.malePlayer = selectedlangOptions?.gamePlayerMaleVoice;
      voiceId.femalePlayer = selectedlangOptions?.gamePlayerFemaleVoice;
      break;
    case "Narrator":
      voiceId.narrator = selectedlangOptions?.gameNarratorVoice;
      break;
    default:
      voiceId.nonplayer = selectedlangOptions?.gameNonPlayerVoice;
  }
  return voiceId;
};

const getConvertedTextToAudioUrls = async (
  apiReqHeaderData,
  newLangContentRow,
  reqBody,
  langRowData
) => {
  /**params{
 * updatedContent-> translated text content 
 * apiReqHeaderData-> text: updatedContent,
                  model_id: "eleven_multilingual_v2",
                  voice_settings: {
                    similarity_boost: .4,
                    stability: .7,
                    style: .1,
                    use_speaker_boost: true,
                  },
 * newLangContentRow  -> {gameId: data.gameId,
                  translationId: data.translationId,
                  tblName: "lmsblocks",
                  textId: row.blockId,
                  content: updatedContent,
                  fieldName: "blockText",
                  }
  * reqBody  -> req.body
 * langRowData      ->lmsMultipleLanuageSupport table row data
 * 
*/

  const voiceId = await getSpeakerVoiceId(newLangContentRow, reqBody);

  /** You may get multiple audio files for players when palyer became a speaker of the content like choosed question options & dialog and response, etc.,*/
  const audioUrlArray = await convertTextToAudio(
    apiReqHeaderData,
    voiceId,
    reqBody?.gameId,
    langRowData?.language_code
  );
  /** Write code to store thi into table as sring for receied array ny looping the audioUrlArray*/
  let jsonObjectArray = [];

  console.log("audioUrlArray", audioUrlArray);
    if (audioUrlArray.status == "Success") {
    const dataArray = audioUrlArray.data;
    for (let data of dataArray) {
      // let voiceId = data.filename.split("_")[1];
      /** filename: 'ta_D38z5RcWu1voky8WS1ja_1708683731564.mp3'
       *             langCode_VoiceId_timestamp.format
                        0        1        2
      */
                        
      jsonObjectArray.push({ voiceId: data.voiceId, audioUrl: data.path });
    }
    return JSON.stringify(jsonObjectArray); // data stored in Json format in DB. Need to stringify before use it
  }
  return "";
};

const deleteAudioFiles = async (audiosUrls = []) => {
  // const deleteAudioFiles = async (req, res)=>{
  //   console.log('audiosUrls',req.body);
  try {
    // Delete the file
    const promise = req.body.map(async (url) => {
      await fsp.unlink(url);
      console.log("url", url);
    });
    await Promise.all(promise);

    return { status: "Success", message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { status: "Failure", message: error.message };
  }
};

const getGameLanguages = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(404)
        .json({ status: "Failure", message: "Bad request" });
        const gameLang = await lmsGameChoosenLang.findAll({
          where: { gameId: id },
          attributes:[],
          include: [{
            model: LmsLanguages,
            attributes:['language_Id','language_name']
            // as: 'language'
          }]
        });
        if (!gameLang || gameLang.length === 0) {
          return res.status(200).json({
            status: "Success",
            message: "No data found",
            data: []
          });
        }
        const languages = gameLang.map(item => ({
            value: item.lmsMultiLanguageSupport.language_Id,
            label: item.lmsMultiLanguageSupport.language_name
          }));
    
    return res.status(200).json({
      status: "Success",
      message: "Data fetched successfully",
      data: languages
    });
  } catch (e) {
    return res.status(500).json({
      status: "Failure",
      message: "oops! something went wrong",
      err: e.message,
    });
  }
};
const getContentRelatedLanguage = async (req, res) => {
  try {
    const {currGameId, langId} = req.params;
    if (!currGameId || !langId) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Bad request" });
    } 
        
    const gameRelatedLang = await lmsGameContentLang.findAll({
      where: { gameId: currGameId, translationId: langId },
      attributes: ['gamecontentId', 'gameId', 'translationId', 'textId', 'fieldName', 'content', 'audioUrls']
    });

    if (!gameRelatedLang || gameRelatedLang.length === 0) {
      return res.status(200).json({
        status: "Success",
        message: "No data found",
        data: []
      });
    }

    const languagesContent = gameRelatedLang.map(item => ({
      content: item.content,
      audioUrls: item.audioUrls,
      textId:item.textId,
      fieldName:item.fieldName
    }));

    return res.status(200).json({
      status: "Success",
      message: "Data fetched successfully",
      data: languagesContent
    });
  } catch (e) {
    return res.status(500).json({
      status: "Failure",
      message: "Oops! Something went wrong",
      err: e.message,
    });
  }
}
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
  getQuestionResponse,
  getGameLanguages,
  getContentRelatedLanguage
};
