const previewLogs = require("../../models/previewLogs");
const { Sequelize, Op } = require('sequelize');
const PreviewLogs = require("../../models/previewLogs"); 

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
    res.status(200).json({"req.body.previewLogId": req.body.previewLogId});
      const userDetails = await previewLogs.update(req.body,  {where: {
        previewLogId: req.body.previewLogId,
      }});
      if(userDetails.ok){
        return res.status(200).json({ status: "Success"}); 
      } else {
        return res.status(400).json({ status: "Failure", error: 'Unable to update'}); 
      }
    }
  } catch (error) {
    console.error('Error updating preview logs:', error.message); // Log specific error message
    return res.status(500).json({ success: false, message: 'Internal server error.' }); // Return here to exit the function
  }
};


const getPreviewLogs=async(req, res)=>{

}

module.exports = {updatePreviewLogs, getPreviewLogs}