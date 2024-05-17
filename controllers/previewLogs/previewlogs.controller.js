const previewLogs = require("../../models/previewLogs");
const { Sequelize, Op, DATE } = require('sequelize');
const PreviewLogs = require("../../models/previewLogs"); 
const LmsBlocks = require("../../models/blocks");

const updatePreviewLogs = async (req, res) => {
  try {
    // Parse the userDataString back into an object
    if (!req.body?.previewLogId || req.body?.previewLogId == null) {
      let logData = null;

      // Check if the type is 'creator' or 'reviewer'
      if ((req.body.type === 'creator' || req.body.type === 'reviewer') && req.body.playerId && req.body.gameId){
        const userDetails = await previewLogs.findOne({ 
          where: { 'playerType': req.body.type, 'previewGameId': {[Op.eq]: req.body.gameId}, 'playerId':  {[Op.eq]: req.body.playerId}} ,
          logging: true
        });    

        if (userDetails === null) {
          // If user not in preview logs table, create a new entry
          const newUserLog = await previewLogs.create({
            playerId: req.body.playerId,
            playerType: req.body.type,
            previewGameId: req.body.gameId, 
            ipAddress : req.connection.remoteAddress,
            userAgent : req.headers["user-agent"],
            deviceType :req.device.type,
          });
          logData = newUserLog;
        } else {
          logData = userDetails;
        }
      
        return res.status(200).json({ status: "Success", data: logData }); 
      } else {
        // If request does not meet criteria
        return res.status(400).json({ status: "Failure", error: "You are not authorized. Contact site Administrator" });
      }
    } else {
    //  console.log()
    // return res.status(200).json({"req.body.previewLogId": req.body.previewLogId});
   
      const getExistingRecords = await previewLogs.findByPk(req.body.previewLogId);
      if(getExistingRecords.nevigatedSeq == req.body.nevigatedSeq ||
      getExistingRecords.screenIdSeq == req.body.screenIdSeq ||
      getExistingRecords.lastActiveBlockSeq == req.body.lastActiveBlockSeq ||
      getExistingRecords.selectedOptions == req.body.selectedOptions ||
      getExistingRecords.previewScore == req.body.previewScore ||
      getExistingRecords.previewProfile == req.body.previewProfile ||
      getExistingRecords.audioVolumeValue == req.body.audioVolumeValue || getExistingRecords.playerInputs == req.body.playerInputs)
      {
        console.log("Looking for an update")
        
        const userDetails = await previewLogs.update(req.body,  {where: {
          previewLogId: req.body.previewLogId,
        }});

        if(userDetails.length > 0){
          return res.status(200).json({ status: "Success",  "Message": "Record Updated"}); 
        } else {
          return res.status(400).json({ status: "Failure", error: 'Unable to update'}); 
        }
      }
      else{
        console.log("Mising to an update")
        return res.status(200).json({ status: "Success", "Message": "No Updates"}); 
      }
    }
  } catch (error) {
    console.error('Error updating preview logs:', error.message); // Log specific error message
    return res.status(500).json({ status: "Failure", message: error.message }); // Return here to exit the function
  }
};


const updateBlockModifiedLog=async(req, res)=>{
    // try{
        console.log('playerLog 123 **',req.body.lastModifiedBlockSeq); //{Input: 8, Quest: 1}
        if(req.body?.playerId)
        {
            const getBlockId =  await LmsBlocks.findOne({
              where:{
                blockGameId:req.body.previewGameId,
                blockQuestNo:req.body.lastModifiedBlockSeq.Quest,
                blockSecondaryId:req.body.lastModifiedBlockSeq.Input,
              }
            });
            const blockid = getBlockId.blockId;
            console.log(blockid);
            const playerLog = await PreviewLogs.update({ lastModifiedBlockSeq: blockid, lastBlockModifiedDate: new Date(),ipAddress : req.connection.remoteAddress,
              userAgent : req.headers["user-agent"],
              deviceType :req.device.type,}, {where: {playerId:{[Op.eq]: req.body.playerId}, playerType:{[Op.eq]: req.body.playerType},previewGameId:{[Op.eq]: req.body.previewGameId} }, logging:true});
            console.log('playerLog **',playerLog)   
        }
    // }
// catch(error){
//     return res.status(400).json({status: "Failure", error: error.message});
// }
}

const getPrivewlogData = async (req, res) => {
  try {
    const { previewGameId, playerId, playerType } = req.body; // Assuming data is sent in the request body

    // Construct the query based on provided parameters
    const previewLog = await PreviewLogs.findOne({
      where: {
        previewGameId: previewGameId,
        playerId: playerId,
        playerType: playerType
      },
      attributes: ['playerInputs'] // Specify the attribute to retrieve
    });

    if (previewLog) {
      // Send the found playerInputs as a response
      res.status(200).json({playerInputs: previewLog.playerInputs });
    } else {
      // If no matching record found, send an appropriate response
      res.status(404).json({ success: false, message: 'Preview log not found' });
    }
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
module.exports = {updatePreviewLogs, updateBlockModifiedLog ,getPrivewlogData}