'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql')

const restService = express();

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/echo', function(req, res) {
    var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Oopps! Seems like some problem. Speak again."
    return res.json({
        speech: speech,
        displayText: speech,
        source: 'webhook-echo-sample'
    });
});

restService.post('/slack-test', function(req, res) {

	var res1 = {};
	//For padding
	var zpad = require('zpad');

	//Get the parameter values
	var param1 = zpad(req.body.result.parameters.project, 3);
	var param2 = zpad(req.body.result.parameters.floor, 2);
	//var param1 = zpad('12', 2);

	//SQL connection
	const config = {
		user: 'eurotowers',
		password: 'd@rnasour123',
		server: '52.187.78.66',
		port: "1994",
		database: 'EREMS_PORTAL_TEST',
		options: {
			encrypt: true // Use this if you're on Windows Azure 
		}
	}

	// connect to your database
	sql.connect(config, function (err) {

		if (err) console.log(err);

		// create Request object
		var request = new sql.Request();

		// query to the database and get the records

		//request.input('projectCode', sql.VarChar(2), param1);
		request.input('floorID', sql.VarChar(2), param2);
		
		request.query('select top 10 ch_unit_id as [key],\'[]\' as [synonyms], rtrim(ch_unit_desc) as ch_unit_desc,mo_lp_with_cwtdisc1=CONVERT(varchar, CAST(mo_lp_with_cwtdisc AS money), 1) From mf_unit_status_details where ch_floor_id=@floorID and ch_proj_code=\'VRC\'', function (err, recordset) {
			if (err) console.log(err)

			var itemObject = {}

			var len = recordset.recordset.length;

			res1 = {
				speech: "List of Units",
				messages: [
					{
						"type": "list_card",
						"platform": "google",
						"title": "Available Units",
						"items": [
						]
					},
					{
						"type": 0,
						"speech": ""
					}
				]
			};

			for (var i = 0; i < len; i++) {
				itemObject = {
					"optionInfo": {
						"key": recordset.recordset[i].key,
						"synonyms": []
					},
					"title": recordset.recordset[i].key,
					"image": {
						"url": "http://cdn4.zipmatch.com/blog/wp-content/uploads/2015/07/bi-level-condo.jpg"
					}
				};
				res1["messages"][0].items[i] = itemObject;
			}
			//return res.json(JSON.stringify(res1));

			return res.json(res1);
			//console.log(JSON.stringify(res1));
		});
	});
	

});




restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
