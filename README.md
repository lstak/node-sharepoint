# SharePoint client for Node.js
This Node module provides a SharePoint client for Node.js applications. This allows you to access SharePoint 2010 lists and items, using ListData.svc, an OData based REST API for SharePoint 2010. 

The current version is restricted to SharePoint Online, using claims based authentication.

## Installation

Use npm to install the module:

````
    > npm install sharepoint
````

## API

Due to the asynchrounous nature of Node.js, the SharePoint client requires the use callbacks in requests. See documentation below.

All callbacks have 2 arguments: err and data:

````
function callback (err, data) {
	// err contains an error, if any
	// data contains the resulting data
} 
````


### SP.RestService(site)
An object of this class represents a REST Service client for the specified SharePoint site.

Example:

````
var client = new SP.RestService('http://oxida.sharepoint.com/teamsite')
````

### client.signin (username, password, callback)
The signin method performs a claims-based authentication:

- build a SAML request (using SAML.xml template included in module)
- submit a SAML token request to Microsoft Online Security Token Service
- receive a signed security token
- POST the token to SharePoint Online
- receive FedAuth and rtFa authentication cookies 
- store the cookies in client for use in subsequent requests 

Callback is called when authentication is completed. You can wrap all your service requests inside this callback

Example:

````
client.signin('myname', 'mypassword', function(err,data) {

	// check for errors during login, e.g. invalid credentials
	if (err) {
        console.log("Error found: ", err);
        return;
    }

	// start to do authenticated requests here....

})
````


### client.metadata(callback)
Return the metadata document for the service ($metadata)

````
var contacts = client.metadata(function(err, data) {
	console.log(data);
});
````


### client.list(name)
Return a new List object, which provides get, update and del(ete) operations

````
var contacts = client.list('Contacts');
````

### list.get(callback)
Fetch all items from list.

````
contacts.get(function (err, data) {
	// data.results contains an array of all items in Contacts list
	// data.__count contains the total number items in Contacts list
	// Use query {$inlinecount:'allpages'} to request the __count property (see below).
})
````

### list.get(id, callback)
Get a single item with id from the list.

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
Use $inlinecount to request the total count of items in list:

````
// get the first 3 items and return total number of items in Contacts list
contacts.get({$top: 3, $inlinecount:'allpages'}, function (err, data) {
	// data contains items from Contacts list, sorted on FirstName.
})
````

### list.add(attributes, callback)
Add a new item to the list 

````
contacts.add({LastName: 'Picolet', FirstName: 'Emma'}, function (err, data) {
	// data contains the new item returned from server.
	// data.Id will be the server assigned Id.
})
````

### list.update(id, attributes, callback)
Update the attributes for the list item specified by Id. The client performs a partial update: only the attributes specified in the hash are changed. Partial updates require the use of etags, so you need to get the item first before you change it.

````
contacts.get(411, function (err, data) {

	var changes = {
		// include the changes that need to be made
		LastName: 'Tell',
		FirstName: 'William',

		// pass the metadata from the fetched item
		// this includes the require etag
		__metadata: data.__metadata
	}

	contacts.update(411, changes, function () {
		// at this point, the change is completed
	})        
})

````

### list.del(id, callback)
Delete list item specified by Id from the list. 

````
contacts.del(411, function (err, data) {
	// at this point deletion is completed.
})

````


## To Do

This first version of SharePoint client library allows you to read and write to SharePoint Online lists. 

There's still a lot to do:

- Implement and improve error handling
- Support for on-premise SharePoint
- Support for other authentication mechanisms (form based, NTLM, ..)
- Support for other SharePoint APIs (SOAP, CSOM).

