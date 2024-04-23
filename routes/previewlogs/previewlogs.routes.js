const express = require('express');
const router = express.Router();
const {updatePreviewLogs, getPreviewLogs} = require('../../controllers/previewLogs/previewlogs.controller');


router.put('/logs', updatePreviewLogs);
router.get('/logs', getPreviewLogs); //game preview logs of an creator/reviewer

module.exports=router;