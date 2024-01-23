const express = require('express');
const { addcohorts,getcohorts,updatecohorts,reomvecohorts,checkCohorts,getAllCohorts} = require('../../controllers/cohorts/cohorts.controller');
const router = express.Router();

router.post('/addcohorts',addcohorts);
router.get('/getcohorts',getcohorts);
router.get('/getAllCohorts',getAllCohorts);
router.put('/update/:id',updatecohorts);
router.get('/check/:id',checkCohorts);
router.get('/reomve/:id',reomvecohorts);

// router.put('/updateCompany/:id',updateCompany);
// router.get('/removeCompany/:id',reomveCompany);
// router.get('/getCompany/:id',getOneCompany);
// router.get('/getCompanyList',getCompaniesList)
module.exports = router;