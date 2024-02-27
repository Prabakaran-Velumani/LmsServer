const updateGame = async (req, res) => {
    try {
      const data = req?.body;
      console.log(data);
      const id = req?.params?.id;
      if(data.gameLastTab) {
        data.gameLastTab = JSON.stringify(data.gameLastTab);
      }
      
      if (data.gameLastTab) {
        const findlasttab = await LmsGame.findOne({
          where: { 
            gameId: id
          }
        });
       
        if (findlasttab && findlasttab.gameLastTabArray) {
          let updatedArray;
          // return res.status(404).json({ status: 'Failure', message: findlasttab});
          try {
            // Try to parse the existing value as JSON
            updatedArray = JSON.parse(findlasttab.gameLastTabArray);
            
            // If successful, check if the value is already in the array
            if (!updatedArray.includes(data.gameLastTab)) {
              // If not inside, push the value into the array
              updatedArray.push(data.gameLastTab);
              findlasttab.gameLastTabArray = JSON.stringify(updatedArray);
          await findlasttab.save();
          data.gameLastTabArray=findlasttab.gameLastTabArray;
            } else {
              data.gameLastTabArray=findlasttab.gameLastTabArray
              console.log(`Value ${data.gameLastTab} is already inside gameLastTabArray`);
            }
          } catch (error) {
            // If parsing fails, handle it accordingly
            console.error('Error parsing gameLastTabArray:', error);
            
          }
  
          // Save the updated array back to the database
          
          
          console.log(`Value ${data.gameLastTab} processed for gameLastTabArray`);
        } else {
          console.log('gameLastTabArray not found or is null');
         
        }
        // Other logic...
     
       
       
        // data.gameLastTab = JSON.stringify(data.gameLastTab);
      }
     
      if (!id) return res.status(404).json({ status: 'Failure', message: "bad Request" });
      if (!req.body) return res.status(404).json({ status: 'Failure', message: "bad Request" });
  
      if (data.gameSkills && Array.isArray(data.gameSkills) && data.gameSkills.length > 0) {
        const updatedSkills = await Promise.all(
          data.gameSkills.map(async (skill) => {
            const existingSkill = await Skill.findOne({ where: { crSkillName: skill.crSkillName } });
  
            return existingSkill ? skill.crSkillId : (await Skill.create({
              crSkillName: skill.crSkillName,
              crSkillStatus: 'Active',
              crDeleteStatus: 'No',
              crCreatedDate: Date.now(),
              crUserAgent: req.headers['user-agent'],
              crIpAddress: req.connection.remoteAddress,
              crDeviceType: req.device.type,
            })).crSkillId;
          })
        );
  
        data.gameSkills = updatedSkills.join(',');
      }
     
      
      
      const checkextentsion = await LmsGame.findOne({ where: { gameId: id } });
  
  if (checkextentsion && checkextentsion.gameExtensionId) {
    data.gameExtensionId = checkextentsion.gameExtensionId;
  } else {
    data.gameExtensionId = id;
  }
  
  
  try {
    const record = await LmsGame.update(data, {
      where: {
        ...(checkextentsion && checkextentsion?.gameExtensionId
          ? { gameExtensionId: checkextentsion.gameExtensionId }
          : { gameId: id }),
        gameQuestNo: data.gameQuestNo
      }
    });
  
    // Handle the result as needed
    console.log('Record updated successfully:', record);
  
    // Send a success response
    res.status(200).json({ status: 'Success', message: 'Record updated successfully' });
  } catch (error) {
    // Handle validation errors
    console.error('Validation error:', error);
  
    // Send an error response
    res.status(400).json({ status: 'Failure', message: 'Validation error', error: error.message });
  }
  
  
     
  res.status(400).json({ status: 'Failure', message: "error.message",data:data.gameSkills });
                  const propertiesToRemove = ['gameTotalScore', 'gameIsSetMinPassScore', 'gameMinScore','gameIsSetDistinctionScore','gameDistinctionScore','gameIsSetSkillWiseScore','gameIsSetBadge','gameBadgeName','gameIsSetCriteriaForBadge','gameAwardBadgeScore','gameScreenTitle','gameIsSetCongratsScoreWiseMessage','gameCompletedCongratsMessage','gameMinimumScoreCongratsMessage','gameLessthanDistinctionScoreCongratsMessage','gameAboveDistinctionScoreCongratsMessage','gameIsSetDistinctionScore'/* Add more property names */];
  
                  // Remove properties using forEach
                  propertiesToRemove.forEach(property => {
                    delete data[property];
                  });
      
  
     const saved= await LmsGame.update(data, {where : {gameExtensionId: data.gameExtensionId}});
  
     if (!record) return res.status(404).json({ status: 'Failure', message: "bad Request" });
  
  return res.status(200).json({ status: 'Success', message: 'Game Updated Successfully', data: record });
    }
    catch (error) {
     return  res.status(500).json({ status: 'Failure', message: "Internal Server Error", err: error });
    }
  }