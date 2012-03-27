# SharePoint client for Node.js
You can use this SharePoint client in Node.js application to access SharePoint 2010 lists and items, using ListData.svc, an OData based REST API for SharePoint 2010. 

The current version is developed for SharePoint Online, using claims based authentication.

## Installation

As usual:

````
    > npm install sharepoint
````

## API

### SP.RestService(site)
Class representing a REST Service client for a SharePoint site.

Example:

    var client = new SP.RestService('http://oxida.sharepoint.com/teamsite')


### client.signin (username, password, callback)
Performs claims-based authentication process:
- submits a SAML token request to Microsoft Online
- receives a signed security token
- POSTs the token the SharePoint online
- receives FedAuht and rtFa authentication cookies 
- will store the cookies in client for subsequent requests by the client

Callback is called when authentication is completed. You can wrap all your service requests inside this callback

Example:

````
client.signin('myname','mypassword',function(err,data) {

	// start to do authenticated requests here....

})
````



### client.list(name)
Return a new List object, which provides get, update and del(ete) operations

````
var contacts = client.list('contacts');
````

### list.get(callback)
Fetch all items from list.

````
contacts.get(function (err, data) {
	// data contains an array of all items in Contacts list
})
````

### list.get(id, callback)
Get a single item from the list.

````
contacts.get(12, function (err, data) {
	// data contains item with Id 12 from Contacts list
})
````

### list.get(query, callback)
Query the list using OData query options.

````
contacts.get({$orderby: 'FirstName'}, function (err, data) {
	// data contains items from Contacts list, sorted on FirstName.
})
````

## Examples

````javascript

// require the module in your code
var SP = require('sharepoint');

var client = new SP.RestService('http://oxida.sharepoint.com/teamsite');



client.signin('l.stakenborg@oxida.com', 'Oxidaluc4', function (err, data) {


````