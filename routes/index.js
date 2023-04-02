module.exports = function (app, addon) {

    // Root route. This route will serve the `atlassian-connect.json` unless the
    // documentation url inside `atlassian-connect.json` is set
    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    // This is an example route that's used by the default "generalPage" module.
    // Verify that the incoming request is authenticated with Atlassian Connect
    app.get('/approvals', addon.authenticate(), (req, res) => {

        // HTTP client which was wraps the Node request library
        // make autheticated calls to confluence
        const httpClient = addon.httpClient(req);
        const contentId = req.query.contentId;

        httpClient.get({
            url: `/rest/api/content/${contentId}/property/approvals`
        }, (err, responseApproval, approvalObj) => {

            approvalObj = JSON.parse(approvalObj)

            const propertyExists = approvalObj.statusCode !== 404;
            const allApprovals = propertyExists ? approvalObj.value.approvedBy : [];
            const version = propertyExists ? approvalObj.version.number : null;

            return res.render('approvals', {
                numberApprovedBy: allApprovals.length,
                allApprovals: JSON.stringify(allApprovals)
            })
        })

    })

    // Add any additional route handlers you need for views or REST resources here...


    // load any additional files you have in routes and apply those to the app
    {
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync("routes");
        for(var index in files) {
            var file = files[index];
            if (file === "index.js") continue;
            // skip non-javascript files
            if (path.extname(file) != ".js") continue;

            var routes = require("./" + path.basename(file));

            if (typeof routes === "function") {
                routes(app, addon);
            }
        }
    }
};
